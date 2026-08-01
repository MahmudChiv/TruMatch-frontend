// ─── GitHub confidence tier ───────────────────────────────────────────────────

export type GithubConfidenceTier = 'high' | 'low' | 'insufficient';

// ─── User types ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  githubId: string;
  username: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  contextNote?: string | null;
  commitmentScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthExchangeResponse {
  accessToken: string;
  user: UserProfile;
}

// ─── GitHub Sync types ────────────────────────────────────────────────────────

export interface GithubSyncQueueResponse {
  status: 'queued';
}

export interface GithubSyncCompleteEvent {
  status: 'complete' | 'failed' | 'insufficient_data';
  score?: number;
  error?: string;
  githubConfidence?: GithubConfidenceTier;
  accountCreatedAt?: string;
}

export interface RepoSignals {
  name: string;
  fullName: string;
  commitGapConsistency: number;
  prMergeRatio: number | null;
  issueCloseRatio: number | null;
  completionSignal: number;
  isCollaborative: boolean;
  repoScore: number;
  totalCommits: number;
}

// ─── Interview WebSocket events ───────────────────────────────────────────────

/** Server → Client: response to interview:start with pre-interview warning */
export interface InterviewStartResponseEvent {
  sessionId: string;
  preInterviewWarning: string;
}

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
  isInterviewFinished?: boolean;
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
  appliedGithubWeight: number;
  appliedInterviewWeight: number;
  declaredHoursPerDay: number | null;
  flaggedDiscrepancies: FlaggedDiscrepancy[];
  communicationStyleNotes: string;
  discrepancyResolutionPattern: number | null;
  scoreExplanationSummary: string | null;
  githubConfidence: GithubConfidenceTier;
  preInterviewWarning: string;
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
  appliedGithubWeight: number;
  appliedInterviewWeight: number;
  declaredHoursPerDay: number | null;
  flaggedDiscrepancies: FlaggedDiscrepancy[];
  cappedDiscrepancyAdjustments: Array<{
    repo: string;
    issue: string;
    originalWeight: number;
    reductionApplied: number;
    cappedAt: number;
  }> | null;
  discrepancyResolutionPattern: number | null;
  communicationNotes: string | null;
  scoreExplanationSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GithubMetricsData {
  id: string;
  userId: string;
  status: string;
  githubConsistencyScore: number | null;
  repoBreakdown: RepoSignals[];
  githubConfidence: GithubConfidenceTier;
  accountCreatedAt: string | null;
  qualifyingRepoCount: number;
  totalCommitCount: number;
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewAnalysis {
  specificity_score: number;
  declared_hours_per_day: number;
  flagged_discrepancies: FlaggedDiscrepancy[];
  communication_style_notes: string;
  bio_summary: string;
  discrepancy_explanations: Array<{
    repo: string;
    issue: string;
    original_weight: number;
    explanation_quality: number;
    reduction_applied: number;
  }>;
}

export interface InterviewSessionData {
  id: string;
  status: string;
  structuredOutput: InterviewAnalysis | null;
  bioSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  user: UserProfile | null;
  commitmentScore: CommitmentScoreData | null;
  githubMetrics: GithubMetricsData | null;
  interviewSession: InterviewSessionData | null;
}

// ─── Public profile types ─────────────────────────────────────────────────────

export interface PublicProfile {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  bioSummary: string | null;
  contextNote: string | null;
  commitmentScore: {
    score: number;
    githubScore: number;
    interviewScore: number;
    appliedGithubWeight: number;
    appliedInterviewWeight: number;
    scoreExplanationSummary: string | null;
  } | null;
  githubConfidence: GithubConfidenceTier;
  githubConfidenceLabel: string;
  peerRating: null; // Placeholder for future Rating module
}

export interface UpdateProfileDto {
  contextNote?: string | null;
  bio?: string | null;
}

// ─── Warning texts (mirrored from backend for client-side rendering) ──────────

export const WARNING_TEXTS = {
  preInterview:
    'Your responses in this interview directly shape your Commitment Score, ' +
    'and your score determines the calibre of teammates you\'ll be matched with. ' +
    'The more specific and honest your answers, the more accurately we can connect ' +
    'you with people who match your level of dedication. There are no trick questions — ' +
    'just be genuine about your experience and availability.',
  teamFormation:
    'After this project wraps up, you\'ll both have the chance to rate each other\'s ' +
    'commitment honestly. These ratings are a core part of how TruMatch stays accurate — ' +
    'they help future teammates know what to expect. Think of it as a mutual agreement: ' +
    'you\'re each investing in the other\'s reputation by giving honest, constructive feedback.',
  charterUnratedTeammate:
    'This teammate\'s commitment score is currently based on their self-reported interview ' +
    'responses and GitHub activity — they haven\'t completed a project on TruMatch yet, so ' +
    'no peer ratings are available. This is completely normal for new members. After this ' +
    'project, the team will have the opportunity to rate one another, which will add a ' +
    'peer-confirmed dimension to everyone\'s score.',
} as const;
