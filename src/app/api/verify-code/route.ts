import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, code } = await request.json();
    const decodedUsername = decodeURIComponent(username);
    
    // Find the user expecting verification
    const user = await User.findOne({ username: decodedUsername });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if matching code and within time window
    const isCodeValid = user.verifyCode === code;
    const isCodeNotExpired = new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeValid && isCodeNotExpired) {
      user.isVerified = true;
      user.verifyCode = undefined; // Clear code payload for security
      user.verifyCodeExpiry = undefined; 
      await user.save();

      return NextResponse.json(
        { success: true, message: 'Account verified successfully' },
        { status: 200 }
      );
    } else if (!isCodeNotExpired) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please sign up again to get a new code.' },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Incorrect verification code' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json(
      { success: false, message: 'Error checking verification code' },
      { status: 500 }
    );
  }
}
