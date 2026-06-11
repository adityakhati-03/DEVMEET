import 'dotenv/config';
import { Worker } from 'bullmq';
import { env } from './config/env';
import { connectDb } from './config/db';
import { executeProcessor } from './processors/execution.processor';
import { submissionProcessor } from './processors/submission.processor';
import { logger } from './utils/logger';
import { singleContainerManager } from './executors/containerPool';

async function bootstrap() {
  logger.info('[Worker] Starting DevMeet execution worker...');

  // Connect to MongoDB
  await connectDb();
  logger.info('[Worker] MongoDB ready');

  // Containers are created lazily on first run — no pre-warming needed.
  logger.info('[Worker] Single-container mode active. Containers start on first use.');

  // Start BullMQ Worker
  const worker = new Worker('code-execution', executeProcessor, {
    connection: { url: env.redisUrl },
    concurrency: 5,
  });

  const subWorker = new Worker('interview-submission', submissionProcessor, {
    connection: { url: env.redisUrl },
    concurrency: 5,
  });

  [worker, subWorker].forEach(w => {
    w.on('active',    (job) => { logger.info(`[Worker] Job active: ${job.id}`); });
    w.on('completed', (job) => { logger.info(`[Worker] Job completed: ${job.id}`); });
    w.on('failed',    (job, err) => { logger.error(`[Worker] Job failed: ${job?.id}`, { error: err.message }); });
    w.on('error',     (err) => { logger.error(`[Worker] Worker error`, { error: err.message }); });
  });

  logger.info('[Worker] Ready — listening for code-execution and interview-submission jobs...');

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.warn(`[Worker] ${signal} received. Shutting down gracefully...`);
    await worker.close();
    await subWorker.close();
    await singleContainerManager.cleanupAll();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Worker] Fatal startup error:', err);
  process.exit(1);
});
