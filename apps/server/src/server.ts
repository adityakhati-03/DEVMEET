import 'dotenv/config';
import { validateEnv, env } from './config/env';
import connectDB from './config/db';
import app from './app';
import { setupWebSocketServer } from './collaboration/websocketServer';

process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ UNHANDLED REJECTION! 💥', reason, promise);
});

async function start(): Promise<void> {
  // 1. Validate all required environment variables
  validateEnv();

  // 2. Connect to MongoDB
  await connectDB();

  // 3. Start the HTTP server
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`🚀 DevMeet server running on http://0.0.0.0:${env.port}`);
    console.log(`   Environment : ${env.nodeEnv}`);
    console.log(`   Client URL  : ${env.clientUrl}`);
  });

  // 4. Attach WebSocket server for real-time collaboration
  setupWebSocketServer(server);
}

start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
