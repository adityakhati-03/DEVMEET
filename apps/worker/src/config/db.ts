import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDb(): Promise<void> {
  mongoose.connection.on('connected', () => logger.info('[DB] MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error(`[DB] MongoDB error: ${err.message}`));
  mongoose.connection.on('disconnected', () => logger.warn('[DB] MongoDB disconnected'));

  await mongoose.connect(env.mongodbUri);
}
