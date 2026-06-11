import { Request, Response, NextFunction } from 'express';
import Discussion from '../models/Discussion';
import Event from '../models/Event';
import UserModel from '../models/User';

// ─── Discussions ──────────────────────────────────────────────────────────────

export async function getDiscussions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const discussions = await Discussion.find()
      .populate('author', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: { discussions } });
  } catch (error) { next(error); }
}

export async function createDiscussion(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, content, tags } = req.body as { title: string; content: string; tags?: string[] };
    const userId = req.user!.id;

    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'title and content are required' },
      });
      return;
    }

    const discussion = await Discussion.create({
      title,
      content,
      author: userId,
      tags: tags ?? [],
    });

    res.status(201).json({ success: true, data: { discussion } });
  } catch (error) { next(error); }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: { events } });
  } catch (error) { next(error); }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as {
      title: string; description: string; date: string;
      time: string; location: string; category: string; tags?: string[];
    };
    const userId = req.user!.id;

    const event = await Event.create({ ...body, createdBy: userId });
    res.status(201).json({ success: true, data: { event } });
  } catch (error) { next(error); }
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getMembers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await UserModel.find({ isVerified: true })
      .select('name username avatar bio lastActive createdAt')
      .sort({ lastActive: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: { members } });
  } catch (error) { next(error); }
}
