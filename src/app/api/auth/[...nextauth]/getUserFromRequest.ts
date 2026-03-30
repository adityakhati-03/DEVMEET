import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

export async function getUserFromRequest(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token || !token._id || !token.username) {
    return null;
  }

  return {
    id: token._id as string,
    name: token.username as string,
    picture: `https://api.dicebear.com/7.x/thumbs/svg?seed=${token.username}`,
    color: stringToColor(token.username as string), // optional function
  };
}

// Optional: Convert username to color (for cursors)
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 50%)`;
  return color;
}
