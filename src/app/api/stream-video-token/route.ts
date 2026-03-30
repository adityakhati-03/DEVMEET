import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const apiKey = process.env.STREAM_VIDEO_API_KEY!;
const apiSecret = process.env.STREAM_VIDEO_API_SECRET!;

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const exp = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour expiry
  const payload = { user_id: userId, exp };
  const token = jwt.sign(payload, apiSecret, {
    algorithm: "HS256",
    keyid: apiKey,
  });
  return NextResponse.json({ token });
} 