import mongoose, { Schema, model, Document } from 'mongoose';
import type { IPracticeAttempt } from '@devmeet/shared';

export interface IPracticeAttemptDocument extends Document, Omit<IPracticeAttempt, '_id' | 'createdAt' | 'updatedAt' | 'userId' | 'roomId' | 'problemId' | 'executionJobId'> {
  userId: string;
  roomId: string;
  problemId?: mongoose.Types.ObjectId;
  executionJobId?: string;
}

const practiceAttemptSchema = new Schema<IPracticeAttemptDocument>(
  {
    userId: { type: String, required: true, index: true },
    roomId: { type: String, required: true, index: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem' },
    language: { type: String, required: true },
    code: { type: String, required: true },
    stdin: { type: String, default: '' },
    stdout: { type: String },
    stderr: { type: String },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'timeout', 'compile_error', 'runtime_error'],
      default: 'queued',
      index: true,
    },
    executionJobId: { type: String, index: true },
    executionTimeMs: { type: Number },
    notes: { type: String },
    isBookmarked: { type: Boolean, default: false },
    verdict: { type: String },
  },
  { timestamps: true }
);

const PracticeAttempt = mongoose.models.PracticeAttempt || model<IPracticeAttemptDocument>('PracticeAttempt', practiceAttemptSchema);

export default PracticeAttempt;
