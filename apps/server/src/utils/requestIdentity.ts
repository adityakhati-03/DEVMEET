import { Request } from 'express';

export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown-ip';
}

export function getUserId(req: Request): string | null {
  return req.user?.id || null;
}

export function getRequestEmail(req: Request): string | null {
  if (req.body && typeof req.body.email === 'string') {
    return req.body.email.toLowerCase().trim();
  }
  return null;
}
