import { Request, Response, NextFunction } from 'express';
import FriendshipModel from '../models/Friendship';
import UserModel from '../models/User';

export async function getFriends(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const friends = await FriendshipModel.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: 'accepted',
    }).populate('requester recipient', 'name username avatar');

    const pendingRequests = await FriendshipModel.find({
      recipient: userId,
      status: 'pending',
    }).populate('requester recipient', 'name username avatar');

    res.status(200).json({
      success: true,
      data: { friends, pendingRequests },
    });
  } catch (error) {
    next(error);
  }
}

export async function sendFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { recipientId } = req.body;

    if (!recipientId || userId === recipientId) {
      res.status(400).json({ success: false, error: { message: 'Invalid recipient' } });
      return;
    }

    const existing = await FriendshipModel.findOne({
      $or: [
        { requester: userId, recipient: recipientId },
        { requester: recipientId, recipient: userId },
      ],
    });

    if (existing) {
      res.status(400).json({ success: false, error: { message: 'Friendship or request already exists' } });
      return;
    }

    await FriendshipModel.create({
      requester: userId,
      recipient: recipientId,
      status: 'pending',
    });

    res.status(201).json({ success: true, data: { message: 'Request sent' } });
  } catch (error) {
    next(error);
  }
}

export async function respondToFriendRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params; // friendship ID
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      res.status(400).json({ success: false, error: { message: 'Invalid status' } });
      return;
    }

    const friendship = await FriendshipModel.findOne({ _id: id, recipient: userId });
    if (!friendship) {
      res.status(404).json({ success: false, error: { message: 'Request not found' } });
      return;
    }

    if (status === 'declined') {
      await friendship.deleteOne();
    } else {
      friendship.status = status;
      await friendship.save();
    }

    res.status(200).json({ success: true, data: { message: `Request ${status}` } });
  } catch (error) {
    next(error);
  }
}
