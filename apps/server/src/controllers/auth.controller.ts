import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import { z } from 'zod';
import UserModel from '../models/User';
import { signToken } from '../utils/jwt';
import { createError } from '../middlewares/error.middleware';
import { sendVerificationEmail } from '../services/email.service';
import { env } from '../config/env';
import { redis } from '../config/redis';

// ─── Validation Schemas ───────────────────────────────────────────────────────

const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s]*$/, 'Name can only contain letters, numbers and spaces'),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  email: z.string().email('Invalid email address').max(100),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain uppercase, lowercase, number and special character'
    ),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function generateUniqueUsername(baseName: string): Promise<string> {
  let username = baseName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);

  if (username.length < 3) username = username + 'user';

  let counter = 1;
  let finalUsername = username;

  while (true) {
    const exists = await UserModel.findOne({ username: finalUsername });
    if (!exists) break;
    finalUsername = `${username}${counter++}`;
    if (counter > 100) { finalUsername = `${username}${Date.now()}`; break; }
  }
  return finalUsername;
}

function setAuthCookie(res: Response, token: string): void {
  const isSecure = env.clientUrl.startsWith('https');
  res.cookie('token', token, {
    httpOnly: true,
    secure: isSecure, // Only true if client is HTTPS
    sameSite: isSecure ? 'none' : 'lax', // 'none' requires secure=true
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = signupSchema.parse(req.body);

    const existingByEmail = await UserModel.findOne({ email: body.email.toLowerCase() });

    if (existingByEmail?.isVerified) {
      res.status(409).json({
        success: false,
        error: { code: 'EMAIL_TAKEN', message: 'Email already registered' },
      });
      return;
    }

    let username: string;
    if (body.username) {
      const existingByUsername = await UserModel.findOne({ username: body.username });
      if (existingByUsername?.isVerified) {
        res.status(409).json({
          success: false,
          error: { code: 'USERNAME_TAKEN', message: 'Username already taken' },
        });
        return;
      }
      username = body.username;
    } else {
      username = await generateUniqueUsername(body.name);
    }

    const hashedPassword = await bcrypt.hash(body.password, env.bcryptSaltRounds);
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verifyCodeExpiry = new Date(Date.now() + 3600000);

    let newUser;
    if (existingByEmail && !existingByEmail.isVerified) {
      existingByEmail.password = hashedPassword;
      existingByEmail.name = body.name.trim();
      existingByEmail.verifyCode = verifyCode;
      existingByEmail.verifyCodeExpiry = verifyCodeExpiry;
      newUser = await existingByEmail.save();
    } else {
      newUser = await UserModel.create({
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        password: hashedPassword,
        username,
        isVerified: false,
        verifyCode,
        verifyCodeExpiry,
        isAcceptingMessages: true,
      });
    }

    const emailResult = await sendVerificationEmail(
      body.email.toLowerCase().trim(),
      username,
      verifyCode,
      'verify'
    );

    if (!emailResult.success) {
      next(createError('Failed to send verification email', 500, 'EMAIL_SEND_FAILED'));
      return;
    }

    const { password: _pw, verifyCode: _vc, verifyCodeExpiry: _vce, ...safeUser } =
      newUser.toObject();

    res.status(201).json({
      success: true,
      data: {
        message: 'Account created. Please check your email for the verification code.',
        username: safeUser.username,
        user: safeUser,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message ?? 'Validation failed' },
      });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);

    const user = await UserModel.findOne({
      $or: [{ email: body.identifier }, { username: body.identifier }],
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password' },
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        success: false,
        error: {
          code: 'OAUTH_ACCOUNT',
          message: 'This account uses social login. Please sign in with Google or GitHub.',
        },
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email/username or password' },
      });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_VERIFIED',
          message: 'Please verify your email before logging in.',
        },
      });
      return;
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      isAcceptingMessages: user.isAcceptingMessages,
      pinnedRooms: user.pinnedRooms,
    });

    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      data: {
        message: 'Logged in successfully',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          bio: user.bio,
          isVerified: user.isVerified,
          isAcceptingMessages: user.isAcceptingMessages,
          pinnedRooms: user.pinnedRooms,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: error.errors[0]?.message ?? 'Validation failed' },
      });
      return;
    }
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', { path: '/' });
  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

/**
 * GET /api/auth/me
 */
export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const cacheKey = `user:profile:${userId}`;
    
    // Check cache
    let cachedProfile = null;
    try {
      cachedProfile = await redis.get(cacheKey);
    } catch (redisErr) {
      console.error('[Redis] Cache read failed:', redisErr);
    }

    if (cachedProfile) {
      res.status(200).json({
        success: true,
        data: { user: JSON.parse(cachedProfile) },
      });
      return;
    }

    // req.user is set by requireAuth middleware
    const user = await UserModel.findById(userId).select(
      '-password -verifyCode -verifyCodeExpiry'
    );

    if (!user) {
      next(createError('User not found', 404, 'USER_NOT_FOUND'));
      return;
    }

    const userProfile = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
      isAcceptingMessages: user.isAcceptingMessages,
      pinnedRooms: user.pinnedRooms,
      lastActive: user.lastActive,
      createdAt: user.createdAt,
    };

    // Set cache
    try {
      await redis.setex(cacheKey, 300, JSON.stringify(userProfile));
    } catch (redisErr) {
      console.error('[Redis] Cache write failed:', redisErr);
    }

    res.status(200).json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/verify-otp
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, code } = req.body as { username: string; code: string };

    if (!username || !code) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'username and code are required' },
      });
      return;
    }

    const user = await UserModel.findOne({ username: decodeURIComponent(username) });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const isCodeValid = user.verifyCode === code;
    const isNotExpired = user.verifyCodeExpiry && new Date(user.verifyCodeExpiry) > new Date();

    if (isCodeValid && isNotExpired) {
      user.isVerified = true;
      user.verifyCode = undefined;
      user.verifyCodeExpiry = undefined;
      await user.save();
      res.status(200).json({ success: true, data: { message: 'Account verified successfully' } });
    } else if (!isNotExpired) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CODE_EXPIRED',
          message: 'Verification code has expired. Please sign up again.',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: { code: 'CODE_INVALID', message: 'Incorrect verification code' },
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
      });
      return;
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    // Always return success to prevent email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        data: { message: 'If this email exists, a reset code has been sent.' },
      });
      return;
    }

    if (!user.isVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOT_VERIFIED',
          message: 'Account not verified. Please complete email verification first.',
        },
      });
      return;
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verifyCode = resetCode;
    user.verifyCodeExpiry = new Date(Date.now() + 3600000);
    await user.save();

    const emailResult = await sendVerificationEmail(user.email, user.username, resetCode, 'reset');

    if (!emailResult.success) {
      next(createError('Failed to send reset email', 500, 'EMAIL_SEND_FAILED'));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'If this email exists, a reset code has been sent.',
        username: user.username,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { username, code, newPassword } = req.body as {
      username: string;
      code: string;
      newPassword: string;
    };

    if (!username || !code || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'username, code, and newPassword are required' },
      });
      return;
    }

    const user = await UserModel.findOne({ username });
    if (!user) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    const isCodeValid = user.verifyCode === code;
    const isNotExpired = user.verifyCodeExpiry && new Date(user.verifyCodeExpiry) > new Date();

    if (!isCodeValid || !isNotExpired) {
      res.status(400).json({
        success: false,
        error: { code: 'CODE_INVALID', message: 'Invalid or expired reset code' },
      });
      return;
    }

    user.password = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
    user.verifyCode = undefined;
    user.verifyCodeExpiry = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      data: { message: 'Password reset successfully. Please log in.' },
    });
  } catch (error) {
    next(error);
  }
}

// ─── OAuth Controllers ─────────────────────────────────────────────────────────

async function handleSocialLogin(email: string, name: string, avatar: string, res: Response) {
  let user = await UserModel.findOne({ email: email.toLowerCase() });

  if (!user) {
    const username = await generateUniqueUsername(name || email.split('@')[0]);
    user = await UserModel.create({
      name: name || username,
      email: email.toLowerCase(),
      username,
      isVerified: true,
      avatar,
      isAcceptingMessages: true,
      password: null, // Explicit null for social users
    });
  } else if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  const token = signToken({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    isVerified: user.isVerified,
    isAcceptingMessages: user.isAcceptingMessages,
    pinnedRooms: user.pinnedRooms,
  });

  setAuthCookie(res, token);
  res.redirect(`${env.clientUrl}/dashboard`);
}

/**
 * GET /api/auth/google
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const redirectUri = `${env.clientUrl}/api/auth/google/callback`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=email profile`;
  res.redirect(url);
}

/**
 * GET /api/auth/google/callback
 */
export async function googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.query;
    if (!code) {
      res.redirect(`${env.clientUrl}/login?error=GoogleAuthFailed`);
      return;
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: `${env.clientUrl}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    });

    const { data: profile } = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    await handleSocialLogin(profile.email, profile.name, profile.picture, res);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    res.redirect(`${env.clientUrl}/login?error=GoogleAuthFailed`);
  }
}

/**
 * GET /api/auth/github
 */
export async function githubLogin(req: Request, res: Response): Promise<void> {
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user:email`;
  res.redirect(url);
}

/**
 * GET /api/auth/github/callback
 */
export async function githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { code } = req.query;
    if (!code) {
      res.redirect(`${env.clientUrl}/login?error=GithubAuthFailed`);
      return;
    }

    const { data } = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }, { headers: { Accept: 'application/json' } });

    const { data: profile } = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });

    let email = profile.email;
    if (!email) {
      const { data: emails } = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0].email;
    }

    await handleSocialLogin(email, profile.name || profile.login, profile.avatar_url, res);
  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.redirect(`${env.clientUrl}/login?error=GithubAuthFailed`);
  }
}
