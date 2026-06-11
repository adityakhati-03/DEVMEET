import { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../utils/rateLimiter';
import { getClientIp, getUserId, getRequestEmail } from '../utils/requestIdentity';

export interface RateLimitMiddlewareOptions {
  scope: string;
  limit: number;
  windowSeconds: number;
  identifier: 'ip' | 'user' | 'email_ip' | ((req: Request) => string);
}

export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let id = '';

      if (typeof options.identifier === 'function') {
        id = options.identifier(req);
      } else {
        switch (options.identifier) {
          case 'ip':
            id = getClientIp(req);
            break;
          case 'user':
            id = getUserId(req) || getClientIp(req);
            break;
          case 'email_ip':
            const email = getRequestEmail(req);
            const ip = getClientIp(req);
            id = email ? `${email}:${ip}` : ip;
            break;
        }
      }

      const key = `rate_limit:${options.scope}:${id}`;
      
      const result = await rateLimit({
        key,
        limit: options.limit,
        windowSeconds: options.windowSeconds,
      });

      // Set headers
      res.setHeader('X-RateLimit-Limit', result.limit.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());

      if (!result.allowed) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
          },
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`[RateLimitMiddleware] Error:`, error);
      // Fail open on unexpected middleware errors
      next();
    }
  };
}
