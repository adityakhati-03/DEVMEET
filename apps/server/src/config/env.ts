/**
 * Validates required environment variables at server startup.
 * Throws early with a clear message if any required var is missing.
 */

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'REDIS_URL',
  'RESEND_API_KEY',
  'STREAM_VIDEO_API_KEY',
  'STREAM_VIDEO_API_SECRET',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nCheck apps/server/.env.example for the full list.`
    );
  }
}

export const env = {
  port: parseInt(process.env.PORT ?? '5000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  resendApiKey: process.env.RESEND_API_KEY!,
  emailFrom: process.env.EMAIL_FROM ?? 'DevMeet <onboarding@resend.dev>',
  streamVideoApiKey: process.env.STREAM_VIDEO_API_KEY!,
  streamVideoApiSecret: process.env.STREAM_VIDEO_API_SECRET!,
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || '',
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  redisUrl: process.env.REDIS_URL!,
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED === 'true',
} as const;
