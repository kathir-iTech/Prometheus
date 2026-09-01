// src/types/argument.ts

export type TrackId = 'scientific_reasoning' | 'historical_analysis' | 'policy_evaluation';

export type SegmentType =
  | 'unsupported_claim'
  | 'reasoning_error'
  | 'knowledge_gap'
  | 'premise_conflict'
  | 'normal';

export interface ArgumentSegment {
  type: SegmentType;
  text: string;
  // Index of the segment this one supports/depends on. null for top-level
  // conclusions that have no parent — this MUST be allowed to be null,
  // never a required number.
  supportsClauseIndex: number | null;
}

export interface RubricScore {
  rigor: number;    // 0-100
  evidence: number; // 0-100
  clarity: number;  // 0-100
}

export interface AnalyzeRequestBody {
  trackId: TrackId;
  studentArgument: string;
}

export interface AnalyzeResponseBody {
  segments: ArgumentSegment[];
  socraticQuestion: string;
  firstPassScore: RubricScore;
}

export interface VerdictRequestBody {
  trackId: TrackId;
  revisedArgument: string;
}

export interface VerdictResponseBody {
  revisedScore: RubricScore;
  sourceCitation: string;
}

export interface SecurityViolationResponse {
  securityViolation: true;
  message: string;
}
