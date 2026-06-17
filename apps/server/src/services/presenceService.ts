import { redis } from '../config/redis';
import User from '../models/User';

const PRESENCE_KEY = 'devmeet:presence';
const PRESENCE_TIMEOUT_MS = 60000; // 60 seconds

export const presenceService = {
  /**
   * Ping presence for a user, updating their last active timestamp.
   */
  pingPresence: async (userId: string) => {
    const now = Date.now();
    await redis.zadd(PRESENCE_KEY, now, userId);
  },

  /**
   * Get list of currently online users (active within the last 60 seconds).
   * Automatically cleans up stale entries.
   */
  getOnlineUsers: async () => {
    const now = Date.now();
    const cutoff = now - PRESENCE_TIMEOUT_MS;

    // 1. Remove users who haven't pinged in the last 60 seconds
    await redis.zremrangebyscore(PRESENCE_KEY, '-inf', cutoff);

    // 2. Fetch active user IDs
    const activeUserIds = await redis.zrange(PRESENCE_KEY, 0, -1);

    if (activeUserIds.length === 0) {
      return [];
    }

    // 3. Fetch user details from MongoDB
    // We only select the minimal necessary fields to keep the response lightweight
    const users = await User.find({ _id: { $in: activeUserIds } })
      .select('name username avatar')
      .lean();

    return users;
  }
};
