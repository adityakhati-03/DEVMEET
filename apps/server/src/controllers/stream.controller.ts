import { Request, Response, NextFunction } from 'express';
import { StreamClient } from '@stream-io/node-sdk';
import Room from '../models/Room';
import { env } from '../config/env';

/**
 * POST /api/stream/token
 *
 * Security: userId is derived from JWT (req.user), NOT from the request body.
 * Only generates a token if the user is a participant of the requested room.
 */
export async function getStreamToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { roomId } = req.body as { roomId?: string };

    // If a roomId is provided, verify the user is a member
    if (roomId) {
      const room = await Room.findOne({ roomId });
      if (!room) {
        res.status(404).json({
          success: false,
          error: { code: 'ROOM_NOT_FOUND', message: 'Room not found' },
        });
        return;
      }

      const participantIds = room.participants.map((p: { toString(): string }) => p.toString());
      const creatorId = room.createdBy.toString();

      if (creatorId !== userId && !participantIds.includes(userId)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'NOT_A_MEMBER',
            message: 'You must be a member of this room to get a video token',
          },
        });
        return;
      }
    }

    if (!env.streamVideoApiKey || !env.streamVideoApiSecret) {
      res.status(500).json({
        success: false,
        error: { code: 'STREAM_NOT_CONFIGURED', message: 'Stream API keys not configured' },
      });
      return;
    }

    const client = new StreamClient(env.streamVideoApiKey, env.streamVideoApiSecret);
    const validity = 60 * 60; // 1 hour
    const token = client.generateUserToken({
      user_id: userId,
      validity_in_seconds: validity,
    });

    res.status(200).json({ success: true, data: { token } });
  } catch (error) {
    next(error);
  }
}
