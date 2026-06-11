import mongoose, { Schema, model, Document } from 'mongoose';
import type { IInterviewEvent } from '@devmeet/shared';

export interface IInterviewEventDocument extends Document, Omit<IInterviewEvent, '_id' | 'createdAt' | 'userId' | 'sessionId'> {
  userId: string;
  sessionId: mongoose.Types.ObjectId;
}

const interviewEventSchema = new Schema<IInterviewEventDocument>(
  {
    roomId: { type: String, required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'InterviewSession', required: true, index: true },
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'session_created',
        'session_started',
        'session_ended',
        'problem_assigned',
        'code_run',
        'solution_submitted',
        'candidate_joined',
        'interviewer_joined',
        'timer_expired',
        'notes_updated'
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const InterviewEvent = mongoose.models.InterviewEvent || model<IInterviewEventDocument>('InterviewEvent', interviewEventSchema);

export default InterviewEvent;
