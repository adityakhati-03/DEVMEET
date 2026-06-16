import { Router } from 'express';
import {
  signup,
  login,
  logout,
  me,
  verifyOtp,
  forgotPassword,
  resetPassword,
  googleLogin,
  googleCallback,
  githubLogin,
  githubCallback,
  completeSignup,
} from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { createRateLimitMiddleware } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiters
const loginLimiter = createRateLimitMiddleware({ scope: 'auth:login', limit: 5, windowSeconds: 15 * 60, identifier: 'ip' });
const signupLimiter = createRateLimitMiddleware({ scope: 'auth:signup', limit: 5, windowSeconds: 60 * 60, identifier: 'ip' });
const otpSendLimiter = createRateLimitMiddleware({ scope: 'auth:send-otp', limit: 3, windowSeconds: 10 * 60, identifier: 'email_ip' });
const otpVerifyLimiter = createRateLimitMiddleware({ scope: 'auth:verify-otp', limit: 5, windowSeconds: 10 * 60, identifier: 'email_ip' });

// Public routes
router.post('/signup', signupLimiter, signup);
router.post('/complete-signup', otpVerifyLimiter, completeSignup);
router.post('/login', loginLimiter, login);
router.post('/logout', logout);
router.post('/verify-otp', otpVerifyLimiter, verifyOtp);
router.post('/forgot-password', otpSendLimiter, forgotPassword);
router.post('/reset-password', otpVerifyLimiter, resetPassword);

// OAuth routes
router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);
router.get('/github', githubLogin);
router.get('/github/callback', githubCallback);

// Protected routes
router.get('/me', requireAuth, me);

export default router;
