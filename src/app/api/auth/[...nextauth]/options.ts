import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"
import UserModel from "@/models/User";
import dbConnect from "@/lib/dbConnect";

export const authOptions: NextAuthOptions = {
    providers: [
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

                    console.log("User found:", {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        username: user.username,
                        isVerified: user.isVerified
                    });

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
        async jwt({ token, user }) {
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