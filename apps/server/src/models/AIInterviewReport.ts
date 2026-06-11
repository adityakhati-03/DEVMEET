import mongoose, { Schema, model, Document } from 'mongoose';
import type { AIInterviewReport as IAIInterviewReport } from '@devmeet/shared';

export interface IAIInterviewReportDocument extends Document, Omit<IAIInterviewReport, '_id' | 'createdAt'> {}

const aiInterviewReportSchema = new Schema<IAIInterviewReportDocument>(
  {
    sessionId: { type: String, required: true, unique: true },
    roomId: { type: String, required: true },
    candidateId: { type: String, required: true },
    problemId: { type: String, required: true },
    finalCode: { type: String },
    language: { type: String },
    correctnessScore: { type: Number, required: true },
    approachScore: { type: Number, required: true },
    complexityScore: { type: Number, required: true },
    codeQualityScore: { type: Number, required: true },
    communicationScore: { type: Number, required: true },
    overallScore: { type: Number, required: true },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    timeComplexity: { type: String },
    spaceComplexity: { type: String },
    aiSummary: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const AIInterviewReport = mongoose.models.AIInterviewReport || model<IAIInterviewReportDocument>('AIInterviewReport', aiInterviewReportSchema);

export default AIInterviewReport;
