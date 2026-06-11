import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Auth middleware — reads JWT from:
 *   1. httpOnly cookie named 'token'
 *   2. Authorization: Bearer <token> header (fallback)
 *
 * Attaches decoded payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 1. Try cookie
  let token: string | undefined = req.cookies?.token;

  // 2. Try Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
      },
    });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid or expired token. Please log in again.',
      },
    });
    return;
  }

  req.user = payload;
  next();
}
