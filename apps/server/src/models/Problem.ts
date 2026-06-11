import mongoose, { Schema, model, Document } from 'mongoose';
import type { IProblem, ProblemDifficulty, ProblemExample, ProblemTestCase } from '@devmeet/shared';

// We omit _id from Document interface to align with shared IProblem
export interface IProblemDocument extends Document, Omit<IProblem, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  createdBy?: mongoose.Types.ObjectId;
}

const problemSchema = new Schema<IProblemDocument>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    description: { type: String, required: true },
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String },
      },
    ],
    constraints: [{ type: String }],
    tags: [{ type: String }],
    starterCode: {
      cpp: { type: String },
      python: { type: String },
      javascript: { type: String },
    },
    driverCode: {
      cpp: { type: String },
      python: { type: String },
      javascript: { type: String },
    },
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        hidden: { type: Boolean, default: false },
        explanation: { type: String },
        type: { type: String, enum: ['basic', 'edge', 'corner', 'large', 'random'] },
        source: { type: String, enum: ['manual', 'ai'], default: 'manual' },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    source: {
      type: String,
      enum: ['manual', 'leetcode', 'ai', 'custom', 'pasted', 'leetcode_style'],
      default: 'manual',
    },
    sourceMetadata: {
      originalUrl: { type: String },
      originalTitle: { type: String },
      generatedFrom: { type: String },
      disclaimer: { type: String },
    },
    solution: {
      approach: { type: String },
      timeComplexity: { type: String },
      spaceComplexity: { type: String },
      referenceCode: {
        cpp: { type: String },
        python: { type: String },
        javascript: { type: String },
      },
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Problem = mongoose.models.Problem || model<IProblemDocument>('Problem', problemSchema);

export default Problem;
