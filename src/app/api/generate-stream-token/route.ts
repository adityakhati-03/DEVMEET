import { NextRequest, NextResponse } from 'next/server';
import { StreamChat } from 'stream-chat';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const apiKey = process.env.STREAM_VIDEO_API_KEY!;
    const apiSecret = process.env.STREAM_VIDEO_API_SECRET!;
    const streamServerClient = StreamChat.getInstance(apiKey, apiSecret);

    const token = streamServerClient.createToken(userId);
    return NextResponse.json({ token });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Unable to generate token' }, { status: 500 });
  }
}
