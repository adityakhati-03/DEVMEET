// lib/dbConnect.ts
import mongoose from "mongoose"; 

let isConnected = false;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const dbConnect = async (retryCount = 0) => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI!, {
      dbName: "devmeet",
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      retryWrites: true,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });

    isConnected = !!db.connections[0].readyState;
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.info('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('Database connection error:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return dbConnect(retryCount + 1);
    }
    
    throw new Error('Failed to connect to database after multiple attempts');
  }
};

export default dbConnect;
