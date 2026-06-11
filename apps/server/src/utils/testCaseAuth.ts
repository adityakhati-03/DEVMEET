import type { JwtPayload } from './jwt';

interface RoomLike {
  createdBy: any; // ObjectId or string
  mode: string;
  interviewType?: string | null;
  participants?: any[];
  interviewParticipants?: Array<{
    userId: any;
    role: 'owner' | 'interviewer' | 'candidate' | 'viewer';
    status?: string;
  }>;
}

interface ProblemLike {
  createdBy?: any;
  isPublic?: boolean;
}

function userIdStr(user: JwtPayload): string {
  return user.id;
}

function roomOwnerStr(room: RoomLike): string {
  return room.createdBy?.toString ? room.createdBy.toString() : String(room.createdBy);
}

function getInterviewRole(user: JwtPayload, room: RoomLike): string | null {
  if (!room.interviewParticipants?.length) return null;
  const participant = room.interviewParticipants.find(
    (p) => p.userId?.toString() === userIdStr(user)
  );
  return participant?.role ?? null;
}

/**
 * Any authenticated room participant can generate visible test cases.
 */
export function canGenerateTestCases(user: JwtPayload, room: RoomLike): boolean {
  const uid = userIdStr(user);

  // Room owner always can
  if (roomOwnerStr(room) === uid) return true;

  // Any participant can
  if (Array.isArray(room.participants)) {
    const isParticipant = room.participants.some((p) => {
      const pid = p?.toString ? p.toString() : String(p);
      return pid === uid;
    });
    if (isParticipant) return true;
  }

  // Interview participants
  if (Array.isArray(room.interviewParticipants)) {
    const isInterviewParticipant = room.interviewParticipants.some(
      (p) => p.userId?.toString() === uid
    );
    if (isInterviewParticipant) return true;
  }

  return false;
}

/**
 * Only interviewers/owners in interview rooms can generate hidden test cases.
 * Candidates and collaboration participants cannot.
 */
export function canGenerateHiddenTestCases(user: JwtPayload, room: RoomLike): boolean {
  if (room.mode !== 'interview') return false;

  const uid = userIdStr(user);
  // Room owner can always
  if (roomOwnerStr(room) === uid) return true;

  // Check interview role
  const role = getInterviewRole(user, room);
  return role === 'interviewer' || role === 'owner';
}

/**
 * Who can save generated test cases to the actual Problem document.
 * - Practice: only if user owns the problem or problem is not public
 * - Interview: only interviewer/owner
 * - Collaboration: only room owner
 */
export function canSaveGeneratedTestCases(
  user: JwtPayload,
  room: RoomLike,
  problem: ProblemLike | null
): boolean {
  const uid = userIdStr(user);

  if (room.mode === 'interview') {
    // Only interviewer/owner
    const role = getInterviewRole(user, room);
    return roomOwnerStr(room) === uid || role === 'interviewer' || role === 'owner';
  }

  if (room.mode === 'practice') {
    if (!problem) return false;
    // User must own the problem if it's public
    const problemOwner = problem.createdBy?.toString ? problem.createdBy.toString() : String(problem.createdBy ?? '');
    if (problemOwner === uid) return true;
    // Non-public problems: owner check done above
    return false;
  }

  // Collaboration: only room owner
  return roomOwnerStr(room) === uid;
}

/**
 * Whether the user can see the expected output of hidden test cases.
 * Candidates NEVER see hidden expected outputs.
 */
export function canViewHiddenExpectedOutputs(user: JwtPayload, room: RoomLike): boolean {
  if (room.mode !== 'interview') {
    // In non-interview modes there are no "hidden" test cases from generation
    // Visible tests are always viewable
    return true;
  }

  const uid = userIdStr(user);
  // Room owner can always see
  if (roomOwnerStr(room) === uid) return true;

  const role = getInterviewRole(user, room);
  return role === 'interviewer' || role === 'owner';
}
