import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If this email exists, a reset code has been sent." },
        { status: 200 }
      );
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, message: "Account not verified. Please complete email verification first." },
        { status: 400 }
      );
    }

    // Generate a fresh 6-digit OTP for password reset
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Reuse verifyCode fields (they are cleared after use anyway)
    user.verifyCode = resetCode;
    user.verifyCodeExpiry = resetCodeExpiry;
    await user.save();

    const emailResult = await sendVerificationEmail(
      user.email,
      user.username,
      resetCode,
      "reset" // purpose flag so the email template can say "reset" vs "verify"
    );

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, message: "Failed to send reset email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "If this email exists, a reset code has been sent.", username: user.username },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
