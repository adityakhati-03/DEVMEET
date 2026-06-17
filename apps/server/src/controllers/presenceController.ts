import { Request, Response } from 'express';
import { presenceService } from '../services/presenceService';

export const getPresence = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    }

    // 1. Ping presence for this user
    await presenceService.pingPresence(userId);

    // 2. Fetch the list of all online users
    const onlineUsers = await presenceService.getOnlineUsers();

    res.status(200).json({
      success: true,
      data: {
        onlineUsers
      }
    });
  } catch (error: any) {
    console.error('[Presence Controller] Error:', error);
    res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
};
