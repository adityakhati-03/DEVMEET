import { Request, Response, NextFunction } from 'express';
import Room from '../models/Room';
import ExecutionJob from '../models/ExecutionJob.model';
import { createError } from '../middlewares/error.middleware';
import { redis } from '../config/redis';
import { z } from 'zod';

const createRoomSchema = z.object({
  roomId: z.string().min(1, 'roomId is required'),
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  mode: z.enum(['collaboration', 'practice', 'interview']).default('collaboration'),
  interviewType: z.enum(['normal', 'ai']).nullable().optional(),
}).refine((data) => {
  if (data.mode === 'interview' && !data.interviewType) return false;
  if (data.mode !== 'interview' && data.interviewType) return false;
  return true;
}, { message: "Invalid interviewType for the selected mode" });

// Helper to invalidate room caches
async function invalidateRoomCache(room: any) {
  if (!room) return;
  const keys: string[] = [`room:${room.roomId}`];
  if (room.createdBy) {
    keys.push(`user:rooms:${room.createdBy.toString()}`);
  }
  if (room.participants && Array.isArray(room.participants)) {
    for (const p of room.participants) {
      keys.push(`user:rooms:${p._id ? p._id.toString() : p.toString()}`);
    }
  }
  if (keys.length > 0) {
    // Unique keys
    const uniqueKeys = Array.from(new Set(keys));
    await redis.del(...uniqueKeys).catch(e => console.error('[Cache] Invalidation error:', e));
  }
}

/**
 * POST /api/rooms
 * Create a new room
 */
export async function createRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Validation failed' },
      });
      return;
    }

    const { roomId, title, description, mode, interviewType } = parsed.data;
    const userId = req.user!.id;

    const existing = await Room.findOne({ roomId });
    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'ROOM_EXISTS', message: 'A room with this ID already exists' },
      });
      return;
    }

    let settings = {
      videoEnabled: true,
      collaborationEnabled: true,
      isSolo: false,
    };

    if (mode === 'practice') {
      settings.videoEnabled = false;
      settings.isSolo = true;
    } else if (mode === 'interview' && interviewType === 'ai') {
      settings.videoEnabled = false;
    }

    const newRoom = await Room.create({
      roomId,
      title: title || '',
      description: description || '',
      mode,
      interviewType: mode === 'interview' ? interviewType : null,
      settings,
      createdBy: userId,
      participants: [userId],
    });

    await invalidateRoomCache(newRoom);

    res.status(201).json({
      success: true,
      data: { room: newRoom },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms
 * Get all rooms where the current user is a creator or participant
 */
export async function getUserRooms(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const cacheKey = `user:rooms:${userId}`;

    let cached = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (e) {
      console.warn('[Redis] Cache read failed, falling back to DB');
    }
    if (cached) {
      res.status(200).json({ success: true, data: { rooms: JSON.parse(cached) } });
      return;
    }

    const rooms = await Room.find({
      $or: [{ createdBy: userId }, { participants: userId }],
    })
      .populate('participants', 'name username avatar email')
      .populate('createdBy', 'name username avatar email')
      .sort({ createdAt: -1 });

    try {
      await redis.setex(cacheKey, 300, JSON.stringify(rooms));
    } catch (e) {
      console.warn('[Redis] Cache write failed');
    }

    res.status(200).json({ success: true, data: { rooms } });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:roomId
 * Get a specific room by roomId string
 */
export async function getRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;
    const cacheKey = `room:${roomId}`;

    let room: any = null;
    let cached = null;
    try {
      cached = await redis.get(cacheKey);
    } catch (e) {
      console.warn('[Redis] Cache read failed');
    }

    if (cached) {
      room = JSON.parse(cached);
    } else {
      room = await Room.findOne({ roomId })
        .populate('participants', 'name username avatar email')
        .populate('createdBy', 'name username avatar email')
        .lean();

      if (room) {
        try {
          await redis.setex(cacheKey, 300, JSON.stringify(room));
        } catch (e) {}
      }
    }

    if (!room) {
      next(createError('Room not found', 404, 'ROOM_NOT_FOUND'));
      return;
    }

    // Check membership (creator or participant)
    const participantIds = room.participants.map((p: { _id: { toString(): string } }) =>
      p._id.toString()
    );
    const creatorId =
      typeof room.createdBy === 'object' && room.createdBy !== null
        ? (room.createdBy as { _id: { toString(): string } })._id.toString()
        : room.createdBy?.toString();

    if (creatorId !== userId && !participantIds.includes(userId)) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not a member of this room' },
      });
      return;
    }

    res.status(200).json({ success: true, data: { room } });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/rooms/:roomId/join
 * Join a room as a participant
 */
export async function joinRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      next(createError('Room not found', 404, 'ROOM_NOT_FOUND'));
      return;
    }

    if (room.mode === 'practice' && room.createdBy.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Practice rooms are solo and cannot be joined by others.' },
      });
      return;
    }

    const alreadyIn = room.participants.some(
      (p: { toString(): string }) => p.toString() === userId
    );

    if (!alreadyIn) {
      room.participants.push(userId as unknown as typeof room.participants[0]);
      await room.save();
      
      const updatedRoom = await Room.findOne({ roomId })
        .populate('participants', 'name username avatar email')
        .populate('createdBy', 'name username avatar email');
      await invalidateRoomCache(updatedRoom);
    }

    res.status(200).json({
      success: true,
      data: { message: 'Joined room successfully', room },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/rooms/:roomId
 * Delete a room (creator only)
 */
export async function deleteRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const room = await Room.findOne({ roomId });
    if (!room) {
      next(createError('Room not found', 404, 'ROOM_NOT_FOUND'));
      return;
    }

    if (room.createdBy.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the room creator can delete it' },
      });
      return;
    }

    await Room.deleteOne({ roomId });
    await invalidateRoomCache(room);

    res.status(200).json({
      success: true,
      data: { message: 'Room deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/rooms/:roomId/executions
 * Get recent execution jobs for a room
 */
export async function getRoomExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

    const room = await Room.findOne({ roomId });
    if (!room) {
      next(createError('Room not found', 404, 'ROOM_NOT_FOUND'));
      return;
    }

    const isMember =
      room.createdBy.toString() === userId ||
      room.participants.some((p: any) => p.toString() === userId);

    if (!isMember) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this room.' } });
      return;
    }

    const executions = await ExecutionJob.find({ roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('jobId userId language status executionTimeMs createdAt completedAt errorMessage');

    res.status(200).json({ success: true, data: { executions } });
  } catch (error) {
    next(error);
  }
}
