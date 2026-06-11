import mongoose, { Schema, model, Document } from 'mongoose';
import type { IInterviewSubmission } from '@devmeet/shared';

export interface IInterviewSubmissionDocument extends Document, Omit<IInterviewSubmission, '_id' | 'createdAt' | 'updatedAt' | 'candidateId' | 'problemId' | 'sessionId'> {
  candidateId: string;
  problemId: mongoose.Types.ObjectId;
  sessionId: mongoose.Types.ObjectId;
}

const interviewSubmissionSchema = new Schema<IInterviewSubmissionDocument>(
  {
    roomId: { type: String, required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    candidateId: { type: String, required: true },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'timeout', 'failed'],
      default: 'queued',
      index: true,
    },
    totalTests: { type: Number, default: 0 },
    passedTests: { type: Number, default: 0 },
    failedTests: { type: Number, default: 0 },
    visibleResults: [
      {
        input: { type: String },
        expectedOutput: { type: String },
        actualOutput: { type: String },
        passed: { type: Boolean },
        status: { type: String },
        stderr: { type: String },
      }
    ],
    hiddenSummary: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    executionJobIds: [{ type: String }],
    executionTimeMs: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const InterviewSubmission = mongoose.models.InterviewSubmission || model<IInterviewSubmissionDocument>('InterviewSubmission', interviewSubmissionSchema);

export default InterviewSubmission;
