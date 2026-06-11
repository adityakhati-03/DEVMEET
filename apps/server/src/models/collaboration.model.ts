import mongoose, { Document, Schema } from 'mongoose';

export interface ICollaborationDocument extends Document {
  roomId: string;
  yjsState: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const CollaborationDocumentSchema = new Schema(
  {
    roomId: {
      type: String,
      ref: 'Room',
      required: true,
      unique: true,
    },
    yjsState: {
      type: Buffer,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CollaborationDocument = mongoose.model<ICollaborationDocument>(
  'CollaborationDocument',
  CollaborationDocumentSchema
);
