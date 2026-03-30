import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, code, newPassword } = await request.json();

    if (!username || !code || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Username, code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: "Password must contain uppercase, lowercase, number & special character." },
        { status: 400 }
      );
    }

    const decodedUsername = decodeURIComponent(username);
    const user = await User.findOne({ username: decodedUsername });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    // Validate OTP
    const isCodeValid    = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (!isCodeValid) {
      return NextResponse.json(
        { success: false, message: "Incorrect reset code." },
        { status: 400 }
      );
    }

    if (!isCodeNotExpired) {
      return NextResponse.json(
        { success: false, message: "Reset code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password and clear OTP fields
    user.password         = await bcrypt.hash(newPassword, 12);
    user.verifyCode       = undefined;
    user.verifyCodeExpiry = undefined;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Password reset successfully. You can now sign in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
