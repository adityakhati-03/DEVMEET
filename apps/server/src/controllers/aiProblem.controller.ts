import { Request, Response } from 'express';
import { aiProblemService } from '../services/aiProblem.service';
import type { JwtPayload } from '../utils/jwt';
import type {
  AIProblemBuilderRequest,
  SaveAIProblemRequest,
  AttachProblemToRoomRequest,
  GenerateAndAttachAIProblemRequest
} from '@devmeet/shared';

export class AIProblemController {
  async generate(req: Request, res: Response) {
    try {
      const user = (req as any).user as JwtPayload;
      const payload = req.body as AIProblemBuilderRequest & { roomId?: string };

      const result = await aiProblemService.generate(user, payload, payload.roomId);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
      } else if (err.code === 'AI_ERROR' || err.code === 'AI_PARSE_ERROR') {
        res.status(500).json({ success: false, error: { code: err.code, message: err.message } });
      } else {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
      }
    }
  }

  async save(req: Request, res: Response) {
    try {
      const user = (req as any).user as JwtPayload;
      const payload = req.body as SaveAIProblemRequest;

      const result = await aiProblemService.save(user, payload);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
      } else if (err.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
      } else if (err.code === 'ALREADY_SAVED') {
        res.status(409).json({ success: false, error: { code: 'ALREADY_SAVED', message: err.message } });
      } else {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
      }
    }
  }

  async attachToRoom(req: Request, res: Response) {
    try {
      const user = (req as any).user as JwtPayload;
      const payload = req.body as AttachProblemToRoomRequest;

      const result = await aiProblemService.attachToRoom(user, payload);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
      } else if (err.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
      } else {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
      }
    }
  }

  async generateAndAttach(req: Request, res: Response) {
    try {
      const user = (req as any).user as JwtPayload;
      const payload = req.body as GenerateAndAttachAIProblemRequest;

      if (!payload.roomId) {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'roomId is required' } });
        return;
      }

      const result = await aiProblemService.generateAndAttach(user, payload);
      res.json({ success: true, data: result });
    } catch (err: any) {
      if (err.code === 'FORBIDDEN') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: err.message } });
      } else if (err.code === 'NOT_FOUND') {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: err.message } });
      } else if (err.code === 'AI_ERROR' || err.code === 'AI_PARSE_ERROR') {
        res.status(500).json({ success: false, error: { code: err.code, message: err.message } });
      } else {
        res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
      }
    }
  }
}

export const aiProblemController = new AIProblemController();
