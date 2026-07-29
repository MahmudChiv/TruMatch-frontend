export interface UserProfile {
  id: string;
  githubId: string;
  username: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  commitmentScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthExchangeResponse {
  accessToken: string;
  user: UserProfile;
}

export interface GithubSyncQueueResponse {
  status: 'queued';
}

export interface GithubSyncCompleteEvent {
  status: 'complete' | 'failed';
  score?: number;
  error?: string;
}

export interface RepoSignals {
  name: string;
  fullName: string;
  commitGapConsistency: number;
  prMergeRatio: number;
  issueCloseRatio: number;
  completionSignal: number;
  repoScore: number;
}

// ─── Interview WebSocket events ───────────────────────────────────────────────

/** Server → Client: a raw text chunk streaming from Gemini */
export interface InterviewChunkEvent {
  sessionId: string;
  chunk: string;
}

/** Server → Client: a full AI message has finished streaming */
export interface InterviewMessageCompleteEvent {
  sessionId: string;
  fullText: string;
  turnIndex: number;
}

/** A single discrepancy flagged between self-report and GitHub data */
export interface FlaggedDiscrepancy {
  repo: string;
  issue: string;
  userExplanation: string;
}

/** Server → Client: interview complete — commitment score payload */
export interface InterviewCompleteEvent {
  sessionId: string;
  commitmentScore: number;
  githubScore: number;
  interviewScore: number;
  declaredHoursPerDay: number | null;
  flaggedDiscrepancies: FlaggedDiscrepancy[];
  communicationStyleNotes: string;
}

/** Server → Client: an unrecoverable error occurred */
export interface InterviewErrorEvent {
  sessionId: string;
  reason: string;
}

/** Client → Server: start event payload */
export interface InterviewStartPayload {
  userId: string;
}

/** Client → Server: answer event payload */
export interface InterviewAnswerPayload {
  userId: string;
  sessionId: string;
  answer: string;
}

/** Client → Server: complete event payload */
export interface InterviewCompletePayload {
  userId: string;
  sessionId: string;
}

// ─── Dashboard data types ─────────────────────────────────────────────────────

export interface CommitmentScoreData {
  id: string;
  userId: string;
  githubScore: number;
  interviewScore: number;
  commitmentScore: number;
  declaredHoursPerDay: number | null;
  flaggedDiscrepancies: FlaggedDiscrepancy[];
  communicationNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GithubMetricsData {
  id: string;
  userId: string;
  status: string;
  githubConsistencyScore: number | null;
  repoBreakdown: RepoSignals[];
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewAnalysis {
  specificity_score: number;
  declared_hours_per_day: number;
  flagged_discrepancies: FlaggedDiscrepancy[];
  communication_style_notes: string;
}

export interface InterviewSessionData {
  id: string;
  status: string;
  structuredOutput: InterviewAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  user: UserProfile | null;
  commitmentScore: CommitmentScoreData | null;
  githubMetrics: GithubMetricsData | null;
  interviewSession: InterviewSessionData | null;
}

