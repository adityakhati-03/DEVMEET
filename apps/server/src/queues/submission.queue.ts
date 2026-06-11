import { Queue } from 'bullmq';
import { env } from '../config/env';

export interface SubmissionJobPayload {
  submissionId: string;
  roomId: string;
  userId: string;
  language: string;
  languageId: number;
  code: string;
  compiler: string;
  testCases: {
    input: string;
    expectedOutput: string;
    hidden: boolean;
  }[];
}

export const submissionQueue = new Queue<SubmissionJobPayload>('interview-submission', {
  connection: { url: env.redisUrl },
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export async function addSubmissionJob(payload: SubmissionJobPayload) {
  console.log(`[Queue] Adding submission ${payload.submissionId} to Redis URL: ${env.redisUrl}`);
  try {
    const job = await submissionQueue.add('submit', payload, {
      jobId: payload.submissionId,
    });
    console.log(`[Queue] Submission job added successfully:`, job?.id);
    if (!job?.id) {
      throw new Error(`BullMQ silently dropped submission ${payload.submissionId}`);
    }
    return job;
  } catch (error: any) {
    console.error(`[Queue] Failed to add submission to Redis:`, error.message);
    throw error;
  }
}
