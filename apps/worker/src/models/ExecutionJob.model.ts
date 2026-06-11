import mongoose, { Schema, Document, model } from 'mongoose';

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout';

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
}

const executionJobSchema = new Schema<IExecutionJobDocument>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    roomId: { type: String, required: true },
    userId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    stdin: { type: String, default: '' },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'timeout'],
      default: 'queued',
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

const ExecutionJob =
  mongoose.models.ExecutionJob ||
  model<IExecutionJobDocument>('ExecutionJob', executionJobSchema);

export default ExecutionJob;
