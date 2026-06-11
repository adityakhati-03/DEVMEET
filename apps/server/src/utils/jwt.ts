import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar: string | null;
  bio: string;
  isVerified: boolean;
  isAcceptingMessages: boolean;
  pinnedRooms?: string[];
}

/**
 * Signs a JWT with the user payload.
 * Token is stored in an httpOnly cookie on the client side.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies and decodes a JWT. Returns null if invalid/expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}
