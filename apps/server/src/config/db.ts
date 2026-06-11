import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

let isConnected = false;

async function connectDB(retryCount = 0): Promise<void> {
  if (isConnected) {
    console.log('=> Using existing MongoDB connection');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const opts = {
    dbName: 'devmeet',
    maxPoolSize: 10,
    minPoolSize: 1,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    serverSelectionTimeoutMS: 8000,
  };

  try {
    await mongoose.connect(uri, opts);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);

    if (retryCount < MAX_RETRIES) {
      console.log(
        `⟳  Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return connectDB(retryCount + 1);
    }
    throw error;
  }
}

export default connectDB;
