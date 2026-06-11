import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { redis } from './config/redis';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import executionRoutes from './routes/execution.routes';
import streamRoutes from './routes/stream.routes';
import communityRoutes from './routes/community.routes';
import friendsRoutes from './routes/friends.routes';
import userRoutes from './routes/user.routes';
import problemRoutes from './routes/problem.routes';
import practiceRoutes from './routes/practice.routes';
import interviewRoutes from './routes/interview.routes';
import aiInterviewRoutes from './routes/aiInterview.routes';
import testCaseRoutes from './routes/testCase.routes';
import aiProblemRoutes from './routes/aiProblem.routes';

// Middlewares
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// ─── Core Middlewares ─────────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // Required for httpOnly cookie to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', async (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'ok' : 'down';
  const redisStatus = redis.status === 'ready' ? 'ok' : 'down';
  
  res.status(200).json({ 
    success: true, 
    data: { 
      server: 'ok', 
      mongodb: dbStatus,
      redis: redisStatus,
      env: env.nodeEnv 
    } 
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/ai-interviews', aiInterviewRoutes);
app.use('/api/test-cases', testCaseRoutes);
app.use('/api/ai-problems', aiProblemRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'The requested route does not exist' },
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

export default app;
