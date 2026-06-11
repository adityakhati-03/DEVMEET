import mongoose, { Schema, model, models } from 'mongoose';

const roomSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    mode: {
      type: String,
      enum: ['collaboration', 'practice', 'interview'],
      default: 'collaboration',
    },
    interviewType: {
      type: String,
      enum: ['normal', 'ai', null],
      default: null,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    settings: {
      videoEnabled: { type: Boolean, default: true },
      collaborationEnabled: { type: Boolean, default: true },
      isSolo: { type: Boolean, default: false },
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'ended', 'archived'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    interviewSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      default: null,
    },
    interviewParticipants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'interviewer', 'candidate', 'viewer'] },
        joinedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['active', 'removed', 'pending'], default: 'pending' },
      }
    ],
  },
  { timestamps: true }
);

const Room = models.Room || model('Room', roomSchema);
export default Room;
