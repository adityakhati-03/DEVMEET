import mongoose, { Schema, model, Document } from 'mongoose';
import type { IInterviewSession } from '@devmeet/shared';

export interface IInterviewSessionDocument extends Document, Omit<IInterviewSession, '_id' | 'createdAt' | 'updatedAt' | 'interviewerId' | 'candidateId' | 'problemId' | 'createdBy'> {
  interviewerId?: string;
  candidateId?: string;
  problemId?: mongoose.Types.ObjectId;
  aiConfig?: any;
  aiState?: any;
  createdBy: string;
}

const interviewSessionSchema = new Schema<IInterviewSessionDocument>(
  {
    roomId: { type: String, required: true, index: true },
    interviewerId: { type: String, default: null },
    candidateId: { type: String, default: null },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', default: null },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed', 'cancelled', 'expired'],
      default: 'scheduled',
    },
    interviewType: { type: String, enum: ['normal', 'ai'], default: 'normal' },
    durationMinutes: { type: Number, required: true },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    notes: { type: String, default: '' },
    createdBy: { type: String, required: true },
    aiConfig: { type: Schema.Types.Mixed },
    aiState: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const InterviewSession = mongoose.models.InterviewSession || model<IInterviewSessionDocument>('InterviewSession', interviewSessionSchema);

export default InterviewSession;
