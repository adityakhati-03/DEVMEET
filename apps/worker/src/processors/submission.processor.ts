import { Job } from 'bullmq';
import InterviewSubmission from '../models/InterviewSubmission.model';
import { runInDocker } from '../executors/dockerExecutor';
import { DOCKER_LANGUAGE_CONFIGS, DOCKER_SUPPORTED_IDS } from '../executors/languageConfig';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import type { SandboxStatus } from '../executors/types';
import { compareOutput } from '../utils/outputComparator';

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

function mapDockerStatus(status: SandboxStatus): string {
  switch (status) {
    case 'completed': return 'accepted';
    case 'timeout': return 'timeout';
    case 'compile_error': return 'compile_error';
    case 'runtime_error': return 'runtime_error';
    case 'failed': return 'failed';
    default: return 'failed';
  }
}

export async function submissionProcessor(job: Job<SubmissionJobPayload>): Promise<void> {
  const { submissionId, roomId, code, languageId, testCases } = job.data;
  logger.info(`[Worker] Submission Job received`, { submissionId });

  await InterviewSubmission.findByIdAndUpdate(submissionId, { status: 'running' });

  try {
    const config = DOCKER_LANGUAGE_CONFIGS[languageId];
    if (!config || !DOCKER_SUPPORTED_IDS.has(languageId)) {
      throw new Error(`Language ${languageId} is not supported by Docker runner.`);
    }

    let passedTests = 0;
    let failedTests = 0;
    let totalTimeMs = 0;
    const visibleResults: any[] = [];
    let finalStatus = 'accepted';

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await runInDocker(config, code, tc.input);
      
      const tcStatus = mapDockerStatus(result.status);
      totalTimeMs += result.executionTimeMs || 0;

      let passed = false;
      let actualStatus = tcStatus;
      
      if (tcStatus === 'accepted') {
        passed = compareOutput(result.stdout || '', tc.expectedOutput);
        if (!passed) actualStatus = 'wrong_answer';
      }

      if (passed) passedTests++;
      else {
        failedTests++;
        if (finalStatus === 'accepted') finalStatus = actualStatus;
      }

      if (!tc.hidden) {
        visibleResults.push({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: result.stdout || '',
          passed,
          status: actualStatus,
          stderr: result.stderr || ''
        });
      }

      // Fast fail on compile errors or timeouts
      if (actualStatus === 'compile_error' || actualStatus === 'timeout') {
        failedTests += (testCases.length - i - 1);
        break;
      }
    }

    const hiddenSummary = {
      total: testCases.length,
      passed: passedTests,
      failed: failedTests
    };

    await InterviewSubmission.findByIdAndUpdate(submissionId, {
      status: finalStatus,
      passedTests,
      failedTests,
      visibleResults,
      hiddenSummary,
      executionTimeMs: totalTimeMs
    });

    // Notify clients
    await redis.publish(
      `room:execution:${roomId}`,
      JSON.stringify({
        type: 'SUBMISSION_RESULT',
        submissionId,
        status: finalStatus
      })
    );
    logger.info(`[Worker] Submission ${submissionId} finished with status ${finalStatus}`);
  } catch (error: any) {
    logger.error(`[Worker] Submission failed`, { submissionId, error: error.message });
    await InterviewSubmission.findByIdAndUpdate(submissionId, { status: 'failed' });
    await redis.publish(
      `room:execution:${roomId}`,
      JSON.stringify({
        type: 'SUBMISSION_RESULT',
        submissionId,
        status: 'failed'
      })
    );
    throw error;
  }
}
