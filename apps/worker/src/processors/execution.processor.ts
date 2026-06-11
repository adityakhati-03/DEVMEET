import { Job } from 'bullmq';
import ExecutionJob from '../models/ExecutionJob.model';
import { runInDocker } from '../executors/dockerExecutor';
import { DOCKER_LANGUAGE_CONFIGS, DOCKER_SUPPORTED_IDS } from '../executors/languageConfig';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import type { SandboxStatus } from '../executors/types';

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

// Map Docker sandbox statuses → ExecutionJob MongoDB statuses
function mapDockerStatus(status: SandboxStatus): string {
  switch (status) {
    case 'completed':    return 'completed';
    case 'timeout':      return 'timeout';
    case 'compile_error': return 'failed';
    case 'runtime_error': return 'failed';
    case 'failed':       return 'failed';
    default:             return 'failed';
  }
}

export async function executeProcessor(job: Job<ExecutionJobPayload>): Promise<void> {
  const { executionJobId, compiler, code, stdin, languageId } = job.data;

  logger.info(`[Worker] Job received`, { jobId: executionJobId, provider: env.executionProvider });

  // Mark as running
  await ExecutionJob.findOneAndUpdate(
    { jobId: executionJobId },
    { status: 'running', startedAt: new Date() }
  );

  logger.info(`[Worker] Job running`, { jobId: executionJobId });

  try {
    // ── Choose execution provider ──────────────────────────────────────────────
    const config = DOCKER_LANGUAGE_CONFIGS[languageId];

    if (!config || !DOCKER_SUPPORTED_IDS.has(languageId)) {
      // Language not supported by Docker runner
      logger.warn(`[Worker] Language ${languageId} not supported by Docker runner.`, { jobId: executionJobId });
      throw new Error(`Language ${languageId} is not supported by the local executor.`);
    }

    logger.info(`[Worker] Executing with Docker`, { jobId: executionJobId, image: config.image });
    const result = await runInDocker(config, code, stdin);

    const mongoStatus = mapDockerStatus(result.status);
    const errorMessage =
      result.status === 'compile_error' ? `Compilation Error:\n${result.stderr}` :
      result.status === 'timeout'       ? `Execution timed out after ${config.timeoutMs / 1000}s.` :
      result.status === 'runtime_error' ? `Runtime Error (exit code ${result.exitCode})` :
      null;

    await ExecutionJob.findOneAndUpdate(
      { jobId: executionJobId },
      {
        status: mongoStatus,
        stdout: result.stdout,
        stderr: result.stderr,
        errorMessage,
        executionTimeMs: result.executionTimeMs,
        compiler: config.image,
        completedAt: new Date(),
      }
    );

    logger.info(`[Worker] Job ${mongoStatus}`, {
      jobId: executionJobId,
      status: result.status,
      executionTimeMs: result.executionTimeMs,
      truncated: result.truncated,
    });

    // Publish result to Redis so WebSocket server can push it to clients
    await redis.publish(
      `room:execution:${job.data.roomId}`,
      JSON.stringify({
        type: 'EXECUTION_RESULT',
        jobId: executionJobId,
        status: mongoStatus,
        stdout: result.stdout,
        stderr: result.stderr,
        errorMessage,
        executionTimeMs: result.executionTimeMs,
      })
    );

  } catch (error: any) {
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.message?.includes('timed out') ||
      error?.message?.includes('abort');

    const finalStatus = isTimeout ? 'timeout' : 'failed';
    const errorMessage = isTimeout
      ? 'Execution timed out.'
      : error?.message ?? 'Unknown execution error.';

    await ExecutionJob.findOneAndUpdate(
      { jobId: executionJobId },
      { status: finalStatus, errorMessage, completedAt: new Date() }
    );

    logger.error(`[Worker] Job ${finalStatus}`, { jobId: executionJobId, error: errorMessage });

    // Publish failure
    await redis.publish(
      `room:execution:${job.data.roomId}`,
      JSON.stringify({
        type: 'EXECUTION_RESULT',
        jobId: executionJobId,
        status: finalStatus,
        errorMessage,
      })
    );

    // Re-throw so BullMQ handles retries
    throw error;
  }
}
