import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import UserModel from "@/models/User";
import dbConnect from "@/lib/dbConnect";

// Helper to generate a unique username from an OAuth profile name/email
async function generateUsernameFromOAuth(name: string, email: string): Promise<string> {
  const base = (name || email.split("@")[0])
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_-]/g, "")
    .substring(0, 18);
  const slug = base.length < 3 ? "user" + base : base;

  let username = slug;
  let counter = 1;
  while (true) {
    const exists = await UserModel.findOne({ username });
    if (!exists) break;
    username = `${slug}${counter++}`;
    if (counter > 100) { username = `${slug}${Date.now()}`; break; }
  }
  return username;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Please provide both email and password");
        }

        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Guard against Google-only accounts trying to use password login
          if (!user.password) {
            throw new Error("This account uses Google sign-in. Please use \"Continue with Google\".");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          if (!user.isVerified) {
            throw new Error("Please verify your account before logging in");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            isVerified: user.isVerified,
            isAcceptingMessages: user.isAcceptingMessages,
            username: user.username,
            avatar: user.avatar,
            bio: user.bio,
            lastActive: user.lastActive
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Authentication failed";
          throw new Error(errorMessage);
        }
      }
    })
  ],
  pages: {
    signIn: '/sign-in',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account }) {
      // Handle OAuth providers (Google & GitHub)
      const isOAuth = account?.provider === "google" || account?.provider === "github";
      if (isOAuth) {
        await dbConnect();
        try {
          const existing = await UserModel.findOne({ email: user.email });
          if (existing) {
            // Backfill avatar from OAuth provider if user doesn't have one yet
            if (!existing.avatar && user.image) {
              existing.avatar = user.image;
              await existing.save();
            }
            return true;
          }
          // First-time OAuth user — auto-create their MongoDB record
          const username = await generateUsernameFromOAuth(user.name || "", user.email || "");
          await UserModel.create({
            name: user.name,
            email: user.email?.toLowerCase().trim(),
            username,
            avatar: user.image || null,
            password: null,
            isVerified: true,        // OAuth providers pre-verify emails
            isAcceptingMessages: true,
          });
        } catch (err) {
          console.error(`${account?.provider} signIn callback error:`, err);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      // On initial credentials sign-in, populate token from returned user object
      if (user) {
        token._id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.username = user.username;
        token.avatar = user.avatar;
        token.bio = user.bio;
        token.lastActive = user.lastActive;
      }
      // For OAuth sign-ins (Google/GitHub), resolve full DB record into the token
      const isOAuthJwt = (account?.provider === "google" || account?.provider === "github") && profile?.email;
      if (isOAuthJwt) {
        await dbConnect();
        const dbUser = await UserModel.findOne({ email: profile!.email });
        if (dbUser) {
          token._id = dbUser._id.toString();
          token.username = dbUser.username;
          token.isVerified = dbUser.isVerified;
          token.isAcceptingMessages = dbUser.isAcceptingMessages;
          token.avatar = dbUser.avatar;
          token.bio = dbUser.bio;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.username = token.username;
        session.user.avatar = token.avatar;
        session.user.bio = token.bio;
        session.user.lastActive = token.lastActive;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};