import mongoose, { Schema, model, Document } from 'mongoose';
import type { AIProblemGenerationMethod, ProblemDifficulty } from '@devmeet/shared';

export interface IAIProblemGenerationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  roomId?: string;
  mode?: 'collaboration' | 'practice' | 'interview' | null;
  interviewType?: 'normal' | 'ai' | null;
  method: AIProblemGenerationMethod;
  input: {
    topic?: string;
    difficulty?: ProblemDifficulty;
    prompt?: string;
    pastedStatement?: string;
    leetcodeQuery?: string;
    tags?: string[];
    languagePreferences?: string[];
  };
  generatedProblem?: any;
  status: 'generated' | 'saved' | 'failed';
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const aiProblemGenerationSchema = new Schema<IAIProblemGenerationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String },
    mode: { type: String, enum: ['collaboration', 'practice', 'interview'] },
    interviewType: { type: String, enum: ['normal', 'ai'] },
    method: {
      type: String,
      enum: ['topic', 'prompt', 'pasted_statement', 'leetcode_style'],
      required: true,
    },
    input: {
      topic: { type: String },
      difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
      prompt: { type: String },
      pastedStatement: { type: String },
      leetcodeQuery: { type: String },
      tags: [{ type: String }],
      languagePreferences: [{ type: String }],
    },
    generatedProblem: { type: Schema.Types.Mixed },
    status: {
      type: String,
      enum: ['generated', 'saved', 'failed'],
      required: true,
    },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

const AIProblemGeneration = mongoose.models.AIProblemGeneration || model<IAIProblemGenerationDocument>('AIProblemGeneration', aiProblemGenerationSchema);

export default AIProblemGeneration;
