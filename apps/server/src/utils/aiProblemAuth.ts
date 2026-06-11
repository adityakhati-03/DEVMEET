import type { JwtPayload } from './jwt';
import type { IRoom, IProblem } from '@devmeet/shared';
import type { IAIProblemGenerationDocument } from '../models/AIProblemGeneration';
import type { IProblemDocument } from '../models/Problem';

/**
 * Checks if a user is allowed to generate an AI problem.
 * If a room is provided, they must be a participant or owner based on mode.
 * If no room is provided, any authenticated user can generate a problem.
 */
export function canGenerateAIProblem(user: JwtPayload, room?: IRoom | null): boolean {
  if (!user) return false;
  if (!room) return true; // standalone generation

  const userId = user.id;
  const isOwner = typeof room.createdBy === 'string' ? room.createdBy === userId : (room.createdBy as any)?._id?.toString() === userId;
  
  const participants = room.participants.map((p: any) => typeof p === 'string' ? p : p._id?.toString());
  const isParticipant = participants.includes(userId);

  switch (room.mode) {
    case 'collaboration':
      return isParticipant || isOwner;
    case 'practice':
      return isOwner; // Only owner can generate problems for their practice room
    case 'interview':
      if (room.interviewType === 'normal') {
        // In normal interview, owner/interviewer can generate
        return isOwner; 
      }
      if (room.interviewType === 'ai') {
        // AI interview: candidate (owner) can generate before session starts
        // But for simplicity of generation, if they are owner they can generate
        return isOwner;
      }
      return false;
    default:
      return false;
  }
}

/**
 * Checks if a user is allowed to save a generated AI problem to the global Problem bank.
 */
export function canSaveAIProblem(user: JwtPayload, generation: IAIProblemGenerationDocument): boolean {
  if (!user) return false;
  // Must be the one who generated it
  return generation.userId.toString() === user.id;
}

/**
 * Checks if a user is allowed to attach a specific problem to a room.
 */
export function canAttachProblemToRoom(user: JwtPayload, room: IRoom): boolean {
  if (!user || !room) return false;

  const userId = user.id;
  const isOwner = typeof room.createdBy === 'string' ? room.createdBy === userId : (room.createdBy as any)?._id?.toString() === userId;

  switch (room.mode) {
    case 'collaboration':
      // Owner attaches problem
      return isOwner;
    case 'practice':
      // Owner attaches problem to their practice session
      return isOwner;
    case 'interview':
      if (room.interviewType === 'normal') {
        // Only interviewer (owner) can assign problems
        return isOwner;
      }
      if (room.interviewType === 'ai') {
        // Candidate (owner) can attach problem before interview starts
        // (Enforced at controller level based on session status)
        return isOwner;
      }
      return false;
    default:
      return false;
  }
}

/**
 * Checks if a user is allowed to view the hidden test cases of a problem.
 * - Problem owners can see them.
 * - Interviewers can see them.
 * - Candidates cannot.
 */
export function canViewProblemHiddenData(user: JwtPayload, problem: IProblemDocument, room?: IRoom | null): boolean {
  if (!user) return false;
  
  const userId = user.id;
  const isProblemOwner = problem.createdBy?.toString() === userId;
  
  if (isProblemOwner) return true;

  if (room) {
    const isRoomOwner = typeof room.createdBy === 'string' ? room.createdBy === userId : (room.createdBy as any)?._id?.toString() === userId;
    
    if (room.mode === 'interview' && room.interviewType === 'normal') {
      return isRoomOwner; // Interviewer can view
    }
  }

  return false; // Default: hide from everyone else
}
