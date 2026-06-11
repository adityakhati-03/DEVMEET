import PracticeAttempt from '../models/PracticeAttempt';
import ExecutionJob from '../models/ExecutionJob.model';

export const practiceService = {
  async getAttempts(userId: string, roomId: string) {
    return PracticeAttempt.find({ userId, roomId }).sort({ createdAt: -1 });
  },

  async getAttemptById(attemptId: string) {
    const attempt = await PracticeAttempt.findById(attemptId);
    if (!attempt) return null;
    
    // Sync status if there's an execution job
    if (attempt.executionJobId && ['queued', 'running'].includes(attempt.status)) {
      const job = await ExecutionJob.findOne({ jobId: attempt.executionJobId });
      if (job && job.status !== attempt.status) {
        attempt.status = job.status as any;
        attempt.stdout = job.stdout;
        attempt.stderr = job.stderr;
        attempt.executionTimeMs = job.executionTimeMs;
        if (job.status === 'failed' && job.errorMessage) {
          attempt.stderr = (attempt.stderr ? attempt.stderr + '\n' : '') + job.errorMessage;
        }
        await attempt.save();
      }
    }
    
    return attempt;
  }
};
