import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import UserModel from '../models/User';
import { redis } from '../config/redis';

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = profileUpdateSchema.parse(req.body);

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: body },
      { new: true, runValidators: true }
    ).select('-password -verifyCode -verifyCodeExpiry');

    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    // Invalidate cache
    await redis.del(`user:profile:${userId}`);

    res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message ?? 'Validation failed' },
      });
      return;
    }
    next(error);
  }
}

export async function togglePinRoom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { roomId } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const pinnedRooms = new Set(user.pinnedRooms || []);
    if (pinnedRooms.has(roomId)) {
      pinnedRooms.delete(roomId);
    } else {
      pinnedRooms.add(roomId);
    }

    user.pinnedRooms = Array.from(pinnedRooms);
    await user.save();

    // Invalidate cache
    await redis.del(`user:profile:${userId}`);

    res.status(200).json({
      success: true,
      data: { pinnedRooms: user.pinnedRooms },
    });
  } catch (error) {
    next(error);
  }
}

export async function getActiveUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeUsers = await UserModel.find({
      lastActive: { $gte: fiveMinsAgo },
      isAcceptingMessages: true,
    })
      .select('name avatar lastActive')
      .sort({ lastActive: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: { users: activeUsers },
    });
  } catch (error) {
    next(error);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(200).json({ success: true, data: { users: [] } });
      return;
    }

    const regex = new RegExp(query, 'i');
    const users = await UserModel.find({
      _id: { $ne: userId },
      $or: [
        { name: { $regex: regex } },
        { username: { $regex: regex } },
      ]
    })
      .select('name username avatar')
      .limit(10);

    res.status(200).json({
      success: true,
      data: { users },
    });
  } catch (error) {
    next(error);
  }
}
