import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const token = await getToken({ req: request });

    if (!token) {
      console.error("No token found in Liveblocks auth");
      return new Response("Unauthorized - No token", { status: 401 });
    }

    if (!token._id) {
      console.error("No _id in token");
      return new Response("Unauthorized - No user ID", { status: 401 });
    }

    // Use name as fallback if username is not available
    const userName = token.username || token.name || token.email || 'Anonymous';

    const session = liveblocks.prepareSession(token._id, {
      userInfo: {
        name: userName,
        color: "#85DBF0", // You can make this dynamic later
        picture: token.avatar || "/default-avatar.png",
      },
    });

    // Allow access to any room - you can make this more restrictive later
    session.allow("*", session.FULL_ACCESS);

    const { body, status } = await session.authorize();
    
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
