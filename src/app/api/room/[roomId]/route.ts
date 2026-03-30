import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Room from "@/models/Room";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const token = await getToken({ req });
    if (!token || !token._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { roomId } = await params;

    const room = await Room.findOne({ roomId });
    if (!room) {
      return NextResponse.json({ message: "Room not found" }, { status: 404 });
    }

    // Only the creator can delete the room
    if (room.createdBy.toString() !== token._id.toString()) {
      return NextResponse.json({ message: "Forbidden: only the room creator can delete it" }, { status: 403 });
    }

    await Room.deleteOne({ roomId });
    return NextResponse.json({ message: "Room deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete Room Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
