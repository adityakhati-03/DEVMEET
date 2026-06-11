import mongoose, { Schema, model, Document } from 'mongoose';
import type { TestCaseType, TestCaseGenerationMode } from '@devmeet/shared';

export interface ITestCaseGenerationDocument extends Document {
  userId: mongoose.Types.ObjectId | string;
  roomId?: string;
  problemId?: mongoose.Types.ObjectId | string;
  mode: TestCaseGenerationMode;
  interviewType: 'normal' | 'ai' | null;
  source: 'ai';
  inputContext: {
    problemTitle?: string;
    problemDescription?: string;
    constraints?: string[];
    examples?: any[];
    existingTestCasesCount?: number;
    language?: string;
  };
  generatedTestCases: Array<{
    input: string;
    expectedOutput: string;
    explanation?: string;
    type: TestCaseType;
    hidden: boolean;
  }>;
  status: 'generated' | 'failed' | 'saved';
  errorMessage?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const testCaseGenerationSchema = new Schema<ITestCaseGenerationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    roomId: { type: String },
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', default: null },
    mode: {
      type: String,
      enum: ['collaboration', 'practice', 'interview'],
      required: true,
    },
    interviewType: {
      type: String,
      enum: ['normal', 'ai', null],
      default: null,
    },
    source: { type: String, enum: ['ai'], default: 'ai' },
    inputContext: {
      problemTitle: { type: String },
      problemDescription: { type: String },
      constraints: [{ type: String }],
      examples: [{ type: Schema.Types.Mixed }],
      existingTestCasesCount: { type: Number },
      language: { type: String },
    },
    generatedTestCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        explanation: { type: String },
        type: {
          type: String,
          enum: ['basic', 'edge', 'corner', 'large', 'random'],
          default: 'basic',
        },
        hidden: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ['generated', 'failed', 'saved'],
      default: 'generated',
    },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

const TestCaseGeneration =
  mongoose.models.TestCaseGeneration ||
  model<ITestCaseGenerationDocument>('TestCaseGeneration', testCaseGenerationSchema);

export default TestCaseGeneration;
