// lib/dbConnect.ts
import mongoose, { Mongoose } from "mongoose";

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  // declare mongoose
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

async function dbConnect(retryCount = 0): Promise<Mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      dbName: "devmeet",
      maxPoolSize: 10,
      minPoolSize: 1,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      serverSelectionTimeoutMS: 8000,
      bufferCommands: false,
    };

    cached!.promise = mongoose.connect(process.env.MONGO_URI!, opts).then((mongoose) => {
      console.log("=> New MongoDB connection established");
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("=> MongoDB connection error:", e);

    if (retryCount < MAX_RETRIES) {
      console.log(`=> Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return dbConnect(retryCount + 1);
    }
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;

