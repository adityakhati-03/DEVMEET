import { Request, Response, NextFunction } from 'express';
import Friendship from '../models/Friendship';
import UserModel from '../models/User';

export async function getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const friendships = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    })
      .populate('requester', 'name username avatar bio lastActive')
      .populate('recipient', 'name username avatar bio lastActive');

    res.status(200).json({ success: true, data: { friendships } });
  } catch (error) { next(error); }
}

export async function sendFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requesterId = req.user!.id;
    const { recipientUsername } = req.body as { recipientUsername: string };

    if (!recipientUsername) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'recipientUsername is required' },
      });
      return;
    }

    const recipient = await UserModel.findOne({ username: recipientUsername });
    if (!recipient) {
      res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
      return;
    }

    if (recipient._id.toString() === requesterId) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Cannot send a friend request to yourself' },
      });
      return;
    }

    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipient._id },
        { requester: recipient._id, recipient: requesterId },
      ],
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Friend request already exists' },
      });
      return;
    }

    const friendship = await Friendship.create({
      requester: requesterId,
      recipient: recipient._id,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: { friendship } });
  } catch (error) { next(error); }
}

export async function respondToFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { action } = req.body as { action: 'accept' | 'decline' };

    const friendship = await Friendship.findById(id);
    if (!friendship) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Friend request not found' },
      });
      return;
    }

    if (friendship.recipient.toString() !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only the recipient can respond to this request' },
      });
      return;
    }

    friendship.status = action === 'accept' ? 'accepted' : 'declined';
    await friendship.save();

    res.status(200).json({ success: true, data: { friendship } });
  } catch (error) { next(error); }
}
