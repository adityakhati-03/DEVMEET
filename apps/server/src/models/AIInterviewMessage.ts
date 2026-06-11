import mongoose, { Schema, model, Document } from 'mongoose';
import type { AIInterviewMessage as IAIInterviewMessage } from '@devmeet/shared';

export interface IAIInterviewMessageDocument extends Document, Omit<IAIInterviewMessage, '_id' | 'createdAt'> {}

const aiInterviewMessageSchema = new Schema<IAIInterviewMessageDocument>(
  {
    sessionId: { type: String, required: true, index: true },
    roomId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, enum: ['candidate', 'ai', 'system'], required: true },
    type: { type: String, enum: ['message', 'hint', 'feedback', 'question', 'evaluation', 'system'], required: true },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AIInterviewMessage = mongoose.models.AIInterviewMessage || model<IAIInterviewMessageDocument>('AIInterviewMessage', aiInterviewMessageSchema);

export default AIInterviewMessage;
