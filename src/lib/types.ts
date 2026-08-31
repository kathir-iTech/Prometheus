export type SegmentType =
  | "reasoning_error"
  | "unsupported_claim"
  | "knowledge_gap"
  | "strong"
  | "normal";

export interface Segment {
  text: string;
  type: SegmentType;
  label: string;
  socratic_question: string;
}

export interface Scores {
  rigor: number;
  clarity: number;
  evidence: number;
}

export type Confidence = "high" | "moderate" | "low";

export interface ScanResult {
  scores: Scores;
  confidence: Confidence;
  segments: Segment[];
  modelUsed?: string;
}

export interface AnalyzeRequest {
  text: string;
}

export interface AnalyzeResponse extends ScanResult {}
