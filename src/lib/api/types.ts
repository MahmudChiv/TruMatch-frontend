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
  roleTags?: string[];
  primaryStack?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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

export interface TranscriptEntry {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

/** Server → Client: response to interview:resume with active transcript */
export interface InterviewResumeResponseEvent {
  resumed: boolean;
  sessionId: string;
  transcript: TranscriptEntry[];
  preInterviewWarning: string;
  isFinished?: boolean;
}

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

export interface AnonymousCommentDto {
  id: string;
  teamId: string;
  comment: string;
  deliveredScore: number;
  communicationScore: number;
  wouldWorkAgain: boolean;
  createdAt: string;
}

export interface PublicPeerRatingSummaryDto {
  peerRatingScore: number | null;
  distinctTeamsRated: number;
  appliedPeerWeight: number;
  comments: AnonymousCommentDto[];
}

export interface CreateRatingDto {
  teamId: string;
  rateeId: string;
  deliveredScore: number;
  communicationScore: number;
  wouldWorkAgain: boolean;
  comment?: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  message?: string;
  payload: any;
  read?: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface PublicProfile {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  bioSummary: string | null;
  contextNote: string | null;
  roleTags?: string[];
  primaryStack?: string | null;
  commitmentScore: {
    score: number;
    githubScore: number;
    interviewScore: number;
    peerRatingScore: number | null;
    appliedGithubWeight: number;
    appliedInterviewWeight: number;
    appliedPeerWeight: number;
    distinctTeamsRated: number;
    scoreExplanationSummary: string | null;
  } | null;
  githubConfidence: GithubConfidenceTier;
  githubConfidenceLabel: string;
  peerRating: PublicPeerRatingSummaryDto | null;
}

export interface UpdateProfileDto {
  contextNote?: string | null;
  bio?: string | null;
  roleTags?: string[];
  primaryStack?: string | null;
}

// ─── Team Matching & Team Charter types ───────────────────────────────────────

export interface TeamCharter {
  visionStatement: string;
  roleComplementarity: string;
  availabilityAgreement: string;
  communicationProtocol: string;
  commitmentPromise: string;
}

export interface CandidateMatchResult {
  user: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    roleTags: string[];
    primaryStack: string | null;
    commitmentScore: number;
    declaredHoursPerDay: number | null;
    githubConfidence: string;
  };
  matchReason: string;
  compatibilityScore: number;
  teamCharter: TeamCharter;
}

export interface TeamMemberUser {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface TeamMemberRecord {
  teamId: string;
  userId: string;
  joinedAt: string;
  user: TeamMemberUser;
}

export interface TeamRecord {
  id: string;
  hackathonId: string;
  creatorId: string;
  targetSize: number;
  status: 'forming' | 'complete';
  createdAt: string;
  updatedAt: string;
  members: TeamMemberRecord[];
}

export interface FindTeammatesResponse {
  candidates: CandidateMatchResult[];
  targetSize: number;
  myTeam: TeamRecord | null;
}

export interface TeamInviteItem {
  id: string;
  hackathonId: string;
  fromUserId: string;
  toUserId: string;
  teamId: string | null;
  charterJson: TeamCharter | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  fromUser?: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    roleTags: string[];
    primaryStack: string | null;
    commitmentScore: number;
  };
  toUser?: {
    id: string;
    username: string;
    name: string | null;
    avatarUrl: string | null;
    roleTags: string[];
    primaryStack: string | null;
    commitmentScore: number;
  };
  hackathon?: {
    id: string;
    title: string;
    logoUrl: string | null;
  };
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

// ─── Hackathons & Admin types ──────────────────────────────────────────────────

export type VenueType = 'physical' | 'virtual' | 'hybrid';
export type HackathonStatus = 'pending' | 'verified' | 'flagged';
export type DistanceTier = 'same_city' | 'same_country' | 'elsewhere';
export type ExtractionSource = 'url' | 'image' | 'manual';

/** AI-structured extraction result returned by Path A (URL) and Path B (image/text) endpoints */
export interface ExtractionResult {
  title: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  eligibility: string | null;
  teamSize: string | null;
  startDate: string | null;
  endDate: string | null;
  applicationDeadline: string | null;
  submissionDeadline: string | null;
  locationLabel: string | null;
  venueType: VenueType | null;
  prizePoolTotal: string | null;
  prizeBreakdown: Array<{ place: string; prize: string }> | null;
  tags: string[] | null;
  externalUrl: string | null;
  /** Field names the model extracted but with low certainty — flagged with ⚠ in the review form */
  low_confidence_fields: string[];
}

/** Response from POST /hackathons/scrape (Path A) */
export interface OgScrapeResult {
  title: string | null;
  description: string | null;
  logoUrl: string | null;
  siteName: string | null;
  /** Full structured extraction result from Gemini */
  extracted: ExtractionResult | null;
  /** Visible page text snapshot — passed back to POST /hackathons as rawSourceText */
  rawSourceText: string | null;
  /** Duplicate match if found */
  duplicate: HackathonSummary | null;
}

/** Response from POST /hackathons/extract-image (Path B) */
export interface ImageExtractionResult {
  extracted: ExtractionResult | null;
  /** OCR text transcript or pasted text snapshot — passed back to POST /hackathons as rawSourceText */
  rawSourceText: string | null;
  /** Supabase Storage path for the uploaded flyer — passed back to POST /hackathons as imageUrl */
  imageStoragePath: string | null;
  /** Fields the model extracted with low certainty */
  lowConfidenceFields: string[];
}

export interface HackathonSummary {
  id: string;
  title: string;
  logoUrl: string | null;
  /** Merged description: shortDescription takes priority over legacy description */
  description: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  eligibility: string | null;
  teamSize: string | null;
  prizePoolTotal: string | null;
  prizeBreakdown: Array<{ place: string; prize: string }> | null;
  applicationDeadline: string | null;
  startDate: string | null;
  endDate: string | null;
  submissionDeadline: string | null;
  venueType: VenueType;
  locationLabel: string | null;
  /** Nullable: image submissions may not have a registration URL yet */
  externalUrl: string | null;
  prizeInfo: string | null;
  tags: string[];
  status: HackathonStatus;
  submittedBy: { username: string; avatarUrl: string | null };
  joinCount: number;
  vouchCount: number;
  hasJoined: boolean;
  hasVouched: boolean;
  distance: number | null;
  distanceTier: DistanceTier;
  createdAt: string;
}

export interface ParticipantUser {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  commitmentScore: number;
}

export interface HackathonDetail extends HackathonSummary {
  latitude: number | null;
  longitude: number | null;
  participants: ParticipantUser[];
  myTeam?: TeamRecord | null;
}

export interface CreateHackathonPayload {
  // ── Required
  title: string;
  // ── Source tracking
  extractionSource?: ExtractionSource;
  // ── Event identity
  externalUrl?: string;
  logoUrl?: string;
  // ── Descriptions
  description?: string;
  shortDescription?: string;
  fullDescription?: string;
  // ── AI-extracted details
  eligibility?: string;
  teamSize?: string;
  // ── Prize
  prizePoolTotal?: string;
  prizeBreakdown?: Array<{ place: string; prize: string }>;
  prizeInfo?: string;
  // ── Dates
  startDate?: string;
  endDate?: string;
  submissionDeadline?: string;
  applicationDeadline?: string;
  // ── Location
  venueType?: VenueType;
  locationLabel?: string;
  latitude?: number;
  longitude?: number;
  // ── Taxonomy
  tags?: string[];
  // ── Admin-only (passed through from extraction response, stored server-side, never returned to public)
  rawSourceText?: string;
  imageUrl?: string;
}

export interface AdminQueueItem {
  id: string;
  title: string;
  logoUrl: string | null;
  description: string | null;
  externalUrl: string | null;
  status: HackathonStatus;
  venueType: VenueType;
  locationLabel: string | null;
  createdAt: string;
  submitter: {
    id: string;
    username: string;
    email: string | null;
    avatarUrl: string | null;
  };
  reports: Array<{
    reason: string;
    createdAt: string;
    user: { username: string };
  }>;
  _count: {
    vouches: number;
    reports: number;
    joins: number;
  };
}

/** Admin-only: source material for reviewing a pending/flagged listing */
export interface AdminSourceResult {
  id: string;
  title: string;
  rawSourceText: string | null;
  imageUrl: string | null;
  extractionSource: ExtractionSource;
  externalUrl: string | null;
  status: HackathonStatus;
  createdAt: string;
  submitter: { username: string; email: string | null };
}


