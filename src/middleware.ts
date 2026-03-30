import { NextRequest, NextResponse } from 'next/server'
import { getToken } from "next-auth/jwt"

// Rate limiting configuration
const RATE_LIMIT = 100; // requests
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Security headers
const securityHeaders = {
  'Content-Security-Policy': 
  "default-src 'self'; " +
  "connect-src 'self' " +
    "wss://liveblocks.io https://liveblocks.io " +
    "wss://api.liveblocks.io https://api.liveblocks.io " +
    "https://hint.stream-io-video.com " +
    "wss://video-stream.getstream.io https://video-stream.getstream.io " +
    "wss://*.stream-io-video.com https://*.stream-io-video.com " +
    "wss://video.stream-io-api.com https://video.stream-io-api.com; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "font-src 'self' data:;"

};

export async function middleware(request: NextRequest) {
  // Rate limiting
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous';
  const now = Date.now();
  const requestData = ipRequestCounts.get(ip) ?? { count: 0, timestamp: now };

  if (now - requestData.timestamp > RATE_LIMIT_WINDOW) {
    requestData.count = 1;
    requestData.timestamp = now;
  } else {
    requestData.count++;
  }

  ipRequestCounts.set(ip, requestData);

  if (requestData.count > RATE_LIMIT) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Add security headers
  const response = NextResponse.next();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const token = await getToken({ req: request });
  const url = request.nextUrl;

  // Allow access to home page, public routes, and some API routes
  if (url.pathname === '/' || 
      url.pathname.startsWith('/_next') || 
      url.pathname.startsWith('/api/auth') ||
      url.pathname.startsWith('/api/signup') ||
      url.pathname.startsWith('/api/verify-code') ||
      url.pathname.startsWith('/api/forgot-password') ||
      url.pathname.startsWith('/api/reset-password') ||
      url.pathname.startsWith('/public')) {
    return response;
  }

  // Protect room-related routes and API endpoints
  if (url.pathname.startsWith('/room') || 
      url.pathname.startsWith('/api/room') ||
      url.pathname.startsWith('/api/liveblocks-auth')) {
    if (!token) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  // If user is not signed in and trying to access protected routes
  if (!token && 
      !url.pathname.startsWith('/sign-in') && 
      !url.pathname.startsWith('/sign-up') &&
      !url.pathname.startsWith('/verify') &&
      !url.pathname.startsWith('/forgot-password') &&
      !url.pathname.startsWith('/reset-password')) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // If user is signed in and trying to access sign-in or sign-up pages
  if (token && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}