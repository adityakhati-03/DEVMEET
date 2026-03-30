import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Room from "@/models/Room";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const token = await getToken({ req });
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ message: "Room ID is required" }, { status: 400 });
    }

    await dbConnect();

    const existingRoom = await Room.findOne({ roomId });
    if (!existingRoom) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Add user to participants if not already present
    if (!existingRoom.participants.includes(token._id)) {
      existingRoom.participants.push(token._id);
      await existingRoom.save();
    }

    return NextResponse.json({ message: "Joined room", room: existingRoom }, { status: 200 });
  } catch (error) {
    console.error("Join Room Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
