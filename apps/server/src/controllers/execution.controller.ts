import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { DOCKER_LANGUAGE_MAP, SUPPORTED_LANGUAGES } from '@devmeet/shared';
import ExecutionJob from '../models/ExecutionJob.model';
import { addExecutionJob } from '../queues/execution.queue';
import Room from '../models/Room';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLanguageName(languageId: number): string {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.id === languageId);
  return lang?.name ?? 'unknown';
}

async function checkRoomMembership(roomId: string, userId: string): Promise<boolean> {
  const room = await Room.findOne({ roomId });
  if (!room) return false;
  return (
    room.createdBy.toString() === userId ||
    room.participants.some((p: any) => p.toString() === userId)
  );
}

// ─── POST /api/execution/run ──────────────────────────────────────────────────

export async function runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code, languageId, roomId, stdin } = req.body as {
      code: string;
      languageId: number;
      roomId: string;
      stdin?: string;
    };

    const userId = req.user!.id;

    // Validate inputs
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      res.status(400).json({ success: false, error: { code: 'INVALID_CODE', message: 'Code is empty or invalid.' } });
      return;
    }
    if (code.length > 50_000) {
      res.status(400).json({ success: false, error: { code: 'CODE_TOO_LARGE', message: 'Code exceeds 50KB limit.' } });
      return;
    }
    if (!languageId || typeof languageId !== 'number') {
      res.status(400).json({ success: false, error: { code: 'INVALID_LANGUAGE', message: 'Invalid language ID.' } });
      return;
    }
    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ success: false, error: { code: 'INVALID_ROOM', message: 'Room ID is required.' } });
      return;
    }
    if (stdin && stdin.length > 10_000) {
      res.status(400).json({ success: false, error: { code: 'STDIN_TOO_LARGE', message: 'stdin exceeds 10KB limit.' } });
      return;
    }

    const compiler = DOCKER_LANGUAGE_MAP[languageId];
    if (!compiler) {
      res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_LANGUAGE', message: `Language ID ${languageId} is not supported.` } });
      return;
    }

    // Room membership check
    const isMember = await checkRoomMembership(roomId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You are not a member of this room.' } });
      return;
    }

    // Create execution job document
    const executionJobId = randomUUID();
    await ExecutionJob.create({
      jobId: executionJobId,
      roomId,
      userId,
      language: getLanguageName(languageId),
      languageId,
      code,
      stdin: stdin ?? '',
      status: 'queued',
      compiler,
    });

    // Push to BullMQ
    await addExecutionJob({
      executionJobId,
      roomId,
      userId,
      language: getLanguageName(languageId),
      languageId,
      code,
      stdin: stdin ?? '',
      compiler,
    });

    res.status(202).json({
      success: true,
      data: {
        jobId: executionJobId,
        status: 'queued',
        message: 'Execution job queued successfully.',
      },
    });
  } catch (error) {
    next(error);
  }
}

// ─── GET /api/execution/jobs/:jobId ──────────────────────────────────────────

export async function getExecutionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const job = await ExecutionJob.findOne({ jobId }) as any;
    if (!job) {
      res.status(404).json({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Execution job not found.' } });
      return;
    }

    // Allow access if: (1) the user submitted this job, OR (2) they are a room member
    const isOwner = job.userId?.toString() === userId;
    if (!isOwner) {
      const isMember = await checkRoomMembership(job.roomId, userId);
      if (!isMember) {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this job.' } });
        return;
      }
    }

    // Prevent browser/CDN from caching job status — must always get fresh data
    res.setHeader('Cache-Control', 'no-store');

    res.status(200).json({
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        language: job.language,
        stdout: job.stdout,
        stderr: job.stderr,
        errorMessage: job.errorMessage,
        executionTimeMs: job.executionTimeMs,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
