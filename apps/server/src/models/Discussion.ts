import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDiscussionDoc extends Document {
  title: string;
  content: string;
  author: Types.ObjectId;
  replies: number;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
}

const DiscussionSchema = new Schema<IDiscussionDoc>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  replies: { type: Number, default: 0 },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
});

export default mongoose.models.Discussion ||
  mongoose.model<IDiscussionDoc>('Discussion', DiscussionSchema);
