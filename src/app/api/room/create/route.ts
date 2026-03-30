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
    if (existingRoom) {
      return NextResponse.json({ message: "Room already exists" }, { status: 400 });
    }

    const newRoom = await Room.create({
      roomId,
      createdBy: token._id,
      participants: [token._id],
    });
    return NextResponse.json({ message: "Room created", room: newRoom }, { status: 201 });
  } catch (error) {
    console.error("Create Room Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
