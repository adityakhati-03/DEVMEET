import { Queue } from 'bullmq';
import { env } from '../config/env';

export interface ExecutionJobPayload {
  executionJobId: string;
  roomId: string;
  userId: string;
  language: string;
  languageId: number;
  code: string;
  stdin: string;
  compiler: string;
}

export const executionQueue = new Queue<ExecutionJobPayload>('code-execution', {
  connection: { url: env.redisUrl },
  defaultJobOptions: {
    attempts: 1,           // no retries — a failed job should not auto-retry
    removeOnComplete: true, // clean up completed jobs immediately
    removeOnFail: true,     // clean up failed jobs so the same jobId can be reused
  },
});

export async function addExecutionJob(payload: ExecutionJobPayload) {
  console.log(`[Queue] Adding job ${payload.executionJobId} to Redis URL: ${env.redisUrl}`);
  try {
    const job = await executionQueue.add('run', payload, {
      jobId: payload.executionJobId,
    });
    console.log(`[Queue] Job added successfully:`, job?.id);
    if (!job?.id) {
      throw new Error(`BullMQ silently dropped job ${payload.executionJobId} — possible duplicate ID in queue`);
    }
    return job;
  } catch (error: any) {
    console.error(`[Queue] Failed to add job to Redis:`, error.message);
    throw error;
  }
}
