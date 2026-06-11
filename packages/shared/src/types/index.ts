// ─── Shared Types ────────────────────────────────────────────────────────────
// Used by both apps/client and apps/server

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  isVerified: boolean;
  isAcceptingMessages: boolean;
  lastActive?: Date;
  pinnedRooms?: string[];
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  username: string;
  avatar: string | null;
  bio: string;
  isVerified: boolean;
  isAcceptingMessages: boolean;
  lastActive: Date | string;
  pinnedRooms?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type RoomMode = 'collaboration' | 'practice' | 'interview';
export type InterviewType = 'normal' | 'ai' | null;

export interface RoomSettings {
  videoEnabled: boolean;
  collaborationEnabled: boolean;
  isSolo: boolean;
}

export interface IRoom {
  _id: string;
  roomId: string;
  mode: RoomMode;
  interviewType: InterviewType;
  title: string;
  description: string;
  settings: RoomSettings;
  status: 'active' | 'ended' | 'archived';
  problemId?: string | null;
  interviewSessionId?: string | null;
  createdBy: IUser | string;
  participants: (IUser | string)[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateRoomRequest {
  title?: string;
  description?: string;
  mode: RoomMode;
  interviewType?: InterviewType;
}

export interface IParticipant {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

export interface IDiscussion {
  _id: string;
  title: string;
  content: string;
  author: IUser | string;
  replies: number;
  tags: string[];
  createdAt: Date;
  lastActivity: Date;
}

export interface IEvent {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: (IUser | string)[];
  maxAttendees: number;
  category: string;
  tags: string[];
  createdBy: IUser | string;
  createdAt: Date;
}

export interface IFriendship {
  _id: string;
  requester: IUser | string;
  recipient: IUser | string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

// ─── API Response Shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ─── Code Execution ───────────────────────────────────────────────────────────

export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'timeout';

export interface ExecutionRequest {
  code: string;
  languageId: number;
  roomId: string;
  stdin?: string;
}

/** Returned immediately after POST /api/execution/run */
export interface ExecutionResponse {
  jobId: string;
  status: ExecutionStatus;
  message: string;
}

/** Full job document returned by GET /api/execution/jobs/:jobId */
export interface IExecutionJob {
  _id: string;
  jobId: string;
  roomId: string;
  userId: string;
  language: string;
  code: string;
  stdin?: string;
  status: ExecutionStatus;
  stdout?: string;
  stderr?: string;
  errorMessage?: string;
  executionTimeMs?: number;
  compiler?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Practice Mode & Problems ──────────────────────────────────────────────────

export type ProblemDifficulty = 'easy' | 'medium' | 'hard';

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemTestCase {
  input: string;
  expectedOutput: string;
  hidden: boolean;
  explanation?: string;
  type?: TestCaseType;
  source?: 'manual' | 'ai';
}

export interface ProblemSolution {
  approach?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  referenceCode?: {
    cpp?: string;
    python?: string;
    javascript?: string;
  };
}

// ─── Test Case Generation ─────────────────────────────────────────────────────

export type TestCaseType = 'basic' | 'edge' | 'corner' | 'large' | 'random';

export type TestCaseGenerationMode = 'collaboration' | 'practice' | 'interview';

export interface GeneratedTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
  type: TestCaseType;
  hidden: boolean;
}

export interface GenerateTestCasesRequest {
  roomId?: string;
  problemId?: string;
  problemTitle?: string;
  problemDescription: string;
  constraints?: string[];
  examples?: ProblemExample[];
  existingTestCases?: ProblemTestCase[];
  language?: string;
  count?: number;
  includeEdgeCases?: boolean;
  includeHidden?: boolean;
  mode: TestCaseGenerationMode;
  interviewType?: 'normal' | 'ai';
}

export interface GenerateTestCasesResponse {
  generationId: string;
  testCases: GeneratedTestCase[];
}

export interface SaveTestCasesRequest {
  generationId: string;
  problemId: string;
  testCases: GeneratedTestCase[];
  saveAsHidden?: boolean;
}


export interface IProblem {
  _id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  description: string;
  examples: ProblemExample[];
  constraints: string[];
  tags: string[];
  starterCode: {
    cpp?: string;
    python?: string;
    javascript?: string;
  };
  driverCode: {
    cpp?: string;
    python?: string;
    javascript?: string;
  };
  testCases: ProblemTestCase[];
  solution?: ProblemSolution;
  createdBy?: IUser | string;
  source: 'manual' | 'leetcode' | 'ai' | 'custom' | 'pasted' | 'leetcode_style';
  sourceMetadata?: {
    originalUrl?: string;
    originalTitle?: string;
    generatedFrom?: string;
    disclaimer?: string;
  };
  isPublic: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ─── AI Problem Builder ────────────────────────────────────────────────────────

export type AIProblemGenerationMethod = 'topic' | 'prompt' | 'pasted_statement' | 'leetcode_style';

export interface AIProblemBuilderRequest {
  method: AIProblemGenerationMethod;
  topic?: string;
  difficulty?: ProblemDifficulty;
  prompt?: string;
  pastedStatement?: string;
  leetcodeQuery?: string;
  tags?: string[];
  languagePreferences?: string[];
  mode?: TestCaseGenerationMode | null;
  interviewType?: 'normal' | 'ai' | null;
}

export interface AIProblemBuilderResponse {
  generationId: string;
  problem: {
    title: string;
    difficulty: ProblemDifficulty;
    description: string;
    examples: ProblemExample[];
    constraints: string[];
    tags: string[];
    starterCode: {
      cpp?: string;
      python?: string;
      javascript?: string;
    };
    driverCode?: {
      cpp?: string;
      python?: string;
      javascript?: string;
    };
    visibleTestCases: ProblemTestCase[];
    hiddenTestCasesCount: number;
    sourceMetadata: {
      generatedFrom?: string;
      disclaimer?: string;
    };
  };
}

export interface SaveAIProblemRequest {
  generationId: string;
  isPublic?: boolean;
}

export interface AttachProblemToRoomRequest {
  problemId: string;
  roomId: string;
}

export interface GenerateAndAttachAIProblemRequest extends AIProblemBuilderRequest {
  roomId: string;
}

export interface IPracticeAttempt {
  _id: string;
  userId: string;
  roomId: string;
  problemId: string;
  language: string;
  code: string;
  stdin?: string;
  stdout?: string;
  stderr?: string;
  status: ExecutionStatus | 'compile_error' | 'runtime_error';
  executionJobId?: string;
  executionTimeMs?: number;
  notes?: string;
  isBookmarked: boolean;
  verdict?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreatePracticeRoomRequest {
  problemId?: string;
  title?: string;
}

export interface RunPracticeCodeRequest {
  code: string;
  languageId: number;
  stdin?: string;
}

export interface PracticeRoomResponse {
  room: IRoom;
  problem?: Omit<IProblem, 'testCases'> & { testCases: Omit<ProblemTestCase, 'expectedOutput'>[] };
}

// ─── Interview Mode ─────────────────────────────────────────────────────────────

export type InterviewRole = 'owner' | 'interviewer' | 'candidate' | 'viewer';

export interface InterviewParticipant {
  userId: string | IUser;
  role: InterviewRole;
  joinedAt: Date | string;
  status: 'active' | 'removed' | 'pending';
}

export type InterviewStatus = 'scheduled' | 'active' | 'completed' | 'cancelled' | 'expired';

export type AIInterviewStage = 
  | 'intro'
  | 'problem_understanding'
  | 'approach_discussion'
  | 'coding'
  | 'debugging'
  | 'submission'
  | 'feedback'
  | 'completed';

export type AIInterviewerStyle = 'friendly' | 'strict' | 'balanced';

export interface AIInterviewConfig {
  difficulty?: ProblemDifficulty;
  focusAreas?: string[];
  interviewerStyle?: AIInterviewerStyle;
  allowHints?: boolean;
  maxHints?: number;
}

export interface AIInterviewState {
  stage: AIInterviewStage;
  hintsUsed: number;
  lastFeedbackAt: Date | string | null;
  score: number | null;
}

export interface IInterviewSession {
  _id: string;
  roomId: string;
  interviewerId: string | IUser;
  candidateId: string | IUser;
  problemId?: string | IProblem | null;
  status: InterviewStatus;
  interviewType: 'normal' | 'ai';
  durationMinutes: number;
  aiConfig?: AIInterviewConfig;
  aiState?: AIInterviewState;
  startedAt?: Date | string | null;
  endedAt?: Date | string | null;
  expiresAt?: Date | string | null;
  notes?: string;
  createdBy: string | IUser;
  createdAt: Date | string;
  updatedAt: Date | string;
  metadata?: Record<string, any>;
}

export type InterviewSubmissionStatus = 'queued' | 'running' | 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'timeout' | 'failed';

export interface InterviewVisibleResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  status: string;
  stderr?: string;
}

export interface InterviewHiddenSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface IInterviewSubmission {
  _id: string;
  roomId: string;
  sessionId: string;
  candidateId: string | IUser;
  problemId: string | IProblem;
  language: string;
  code: string;
  status: InterviewSubmissionStatus;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  visibleResults: InterviewVisibleResult[];
  hiddenSummary: InterviewHiddenSummary;
  executionJobIds: string[];
  executionTimeMs?: number;
  submittedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IInterviewEvent {
  _id: string;
  roomId: string;
  sessionId: string;
  userId: string | IUser;
  type: 'session_created' | 'session_started' | 'session_ended' | 'problem_assigned' | 'code_run' | 'solution_submitted' | 'candidate_joined' | 'interviewer_joined' | 'timer_expired' | 'notes_updated';
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

export interface CreateInterviewRequest {
  roomId: string;
  candidateId: string;
  problemId?: string;
  durationMinutes: number;
}

export interface RunInterviewCodeRequest {
  code: string;
  languageId: number;
  stdin?: string;
}

export interface SubmitInterviewCodeRequest {
  code: string;
  languageId: number;
}

export interface InterviewTimerResponse {
  status: InterviewStatus;
  startedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number;
}

export interface InterviewReport {
  session: IInterviewSession;
  problem?: IProblem;
  events: IInterviewEvent[];
  submissions: IInterviewSubmission[];
}

export interface AIInterviewMessage {
  _id: string;
  sessionId: string;
  roomId: string;
  userId: string | IUser;
  role: 'candidate' | 'ai' | 'system';
  type: 'message' | 'hint' | 'feedback' | 'question' | 'evaluation' | 'system';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date | string;
}

export interface AIInterviewReport {
  _id: string;
  sessionId: string;
  roomId: string;
  candidateId: string | IUser;
  problemId: string | IProblem;
  finalCode?: string;
  language?: string;
  correctnessScore: number;
  approachScore: number;
  complexityScore: number;
  codeQualityScore: number;
  communicationScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  timeComplexity: string;
  spaceComplexity: string;
  aiSummary: string;
  createdAt: Date | string;
}

export interface CreateAIInterviewRequest {
  roomId: string;
  problemId?: string;
  durationMinutes: number;
  difficulty?: ProblemDifficulty;
  focusAreas?: string[];
  interviewerStyle?: AIInterviewerStyle;
}

export interface SendAIMessageRequest {
  content: string;
}

export interface AIHintRequest {}
export interface AICodeReviewRequest {}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  identifier: string; // email or username
  password: string;
}

export interface SignupRequest {
  name: string;
  username?: string;
  email: string;
  password: string;
}
