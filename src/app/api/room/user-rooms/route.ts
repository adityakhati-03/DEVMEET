import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Room from "@/models/Room";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req });
    if (!token || !token._id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    await dbConnect();
    const userId = token._id;
    // Find rooms where user is creator or participant
    const rooms = await Room.find({
      $or: [
        { createdBy: userId },
        { participants: userId },
      ],
    })
      .populate("participants", "name username avatar email")
      .populate("createdBy", "name username avatar email");
    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("User Rooms Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
} 