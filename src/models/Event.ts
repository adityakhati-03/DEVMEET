import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEvent extends Document {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: Types.ObjectId[];
  maxAttendees: number;
  category: string;
  tags: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  attendees: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  maxAttendees: { type: Number, default: 50 },
  category: { type: String, required: true },
  tags: [{ type: String }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema); 