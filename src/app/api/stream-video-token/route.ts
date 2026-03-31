import { StreamClient } from "@stream-io/node-sdk";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.STREAM_VIDEO_API_KEY!;
const apiSecret = process.env.STREAM_VIDEO_API_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: "Stream API keys not configured" }, { status: 500 });
    }

    // Initialize the official Stream SDK client (StreamClient is used for token generation)
    const client = new StreamClient(apiKey, apiSecret);

    // Create a user token with 1 hour expiry
    const validity = 60 * 60; // 1 hour
    const token = client.generateUserToken({ 
      user_id: userId, 
      validity_in_seconds: validity 
    });

    return NextResponse.json({ token });
  } catch (error: unknown) {
    console.error("Stream token generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}