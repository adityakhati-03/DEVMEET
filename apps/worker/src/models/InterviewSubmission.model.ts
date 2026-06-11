import mongoose, { Schema, model, Document } from 'mongoose';

export interface IInterviewSubmissionDocument extends Document {
  status: string;
  passedTests: number;
  failedTests: number;
  visibleResults: any[];
  hiddenSummary: any;
  executionTimeMs: number;
}

const interviewSubmissionSchema = new Schema<IInterviewSubmissionDocument>({}, { strict: false });

const InterviewSubmission = mongoose.models.InterviewSubmission || model<IInterviewSubmissionDocument>('InterviewSubmission', interviewSubmissionSchema);

export default InterviewSubmission;
