import mongoose, { Schema, model, models } from "mongoose";

const roomSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Room = models.Room || model("Room", roomSchema);
export default Room;
