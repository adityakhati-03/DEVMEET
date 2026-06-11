import mongoose, { Schema, model, Document } from 'mongoose';
import type { ExecutionStatus } from '@devmeet/shared';

export interface IExecutionJobDocument extends Document {
  jobId: string;
  roomId: string;
  userId: string;
  language: string;
  code: string;
  stdin?: string;
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  errorMessage?: string;
  executionTimeMs?: number;
  compiler?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const executionJobSchema = new Schema<IExecutionJobDocument>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    stdin: { type: String, default: '' },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'timeout'],
      default: 'queued',
      index: true,
    },
    stdout: { type: String },
    stderr: { type: String },
    errorMessage: { type: String },
    executionTimeMs: { type: Number },
    compiler: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// TTL index: auto-delete completed jobs after 7 days to keep collection lean
executionJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const ExecutionJob =
  mongoose.models.ExecutionJob ||
  model<IExecutionJobDocument>('ExecutionJob', executionJobSchema);

export default ExecutionJob;
