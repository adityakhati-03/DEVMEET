import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import Room from '../models/Room';
import mongoose from 'mongoose';
import { rateLimit } from '../utils/rateLimiter';
import { getClientIp } from '../utils/requestIdentity';

export interface SocketUser {
  id: string;
  roomId: string;
}

export const authenticateSocket = async (
  request: any,
  roomId: string
): Promise<SocketUser> => {
  let token: string | null = null;
  
  // Try getting token from query string
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  token = url.searchParams.get('token');

  // Fallback to cookie
  if (!token && request.headers.cookie) {
    const cookies = request.headers.cookie.split(';').map((c: string) => c.trim());
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    if (tokenCookie) {
      token = tokenCookie.substring(6); // 'token='.length === 6
    }
  }

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    // 1. Verify JWT
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    const userId = decoded.id;

    // 2. Validate room membership
    const room = await Room.findOne({ roomId: roomId });
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if user is creator or participant
    const isParticipant =
      room.createdBy.toString() === userId ||
      room.participants.some((p: any) => p.toString() === userId);

    if (!isParticipant) {
      throw new Error('Not authorized to join this room');
    }

    // Rate Limiting check
    const ip = getClientIp(request);
    const rlKey = `rate_limit:ws:connect:${userId || ip}`;
    const rlResult = await rateLimit({
      key: rlKey,
      limit: 30,
      windowSeconds: 60,
    });

    if (!rlResult.allowed) {
      throw new Error('Rate limit exceeded');
    }

    return { id: userId, roomId };
  } catch (error: any) {
    if (error.message === 'Rate limit exceeded') {
      throw error;
    }
    throw new Error('Invalid token or unauthorized access');
  }
};
