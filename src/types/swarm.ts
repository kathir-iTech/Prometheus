export type AgentId = "architect" | "security" | "optimization";

export type AgentStatus = "thinking" | "working" | "resolved";

export type LogSeverity = "info" | "warn" | "error" | "ok" | "code";

export interface LogStreamPayload {
  agentId: AgentId;
  status: AgentStatus;
  logLine: string;
  logSeverity: LogSeverity;
  percentageComplete: number;
  timestamp: number;
  refactoringImpact?: number;
  codeDebtIndex?: number;
  securityVulnerabilities?: number;
}

export interface AgentState {
  agentId: AgentId;
  label: string;
  color: "cyan" | "emerald" | "purple";
  status: AgentStatus;
  percentageComplete: number;
  logs: string[];
  lastUpdated: number;
}

export interface MetricSummary {
  codeDebtIndex: number;
  securityVulnerabilities: number;
  refactoringImpact: number;
  criticalErrors: number;
}

export interface RepositoryMetadata {
  url: string;
  branch: string;
  framework: string;
  languages: string[];
  fileCount: number;
}

export interface ArchitectureNode {
  id: string;
  path: string;
  moduleCount: number;
  critical: boolean;
  intensity: number;
  x: number;
  y: number;
}

export interface TelemetryMetrics {
  isLocal: boolean;
  dependencyCount: number;
  srcAppFileCount: number;
  packageCount: number;
  astNodeCount: number;
  cyclomaticScore: number;
  averageCyclomatic?: number;
  filesScanned?: number;
}

export interface FileComplexityRecord {
  path: string;
  cyclomatic: number;
  loopDepth: number;
  branchCount: number;
  recursiveImports: number;
  importCount: number;
}

export interface ASTComplexityMap {
  filesScanned: number;
  totalCyclomatic: number;
  averageCyclomatic: number;
  maxComplexityFile: string | null;
  records: FileComplexityRecord[];
}

export interface TooltipPayload {
  name: string;
  importCount: number;
  healthRating: number;
  critical: boolean;
  x: number;
  y: number;
}

export interface CaseStudyStat {
  value: string;
  label: string;
}

export interface CaseStudyData {
  id: string;
  tag: string;
  title: string;
  body: string;
  stats: CaseStudyStat[];
}

export interface CyclogramReport {
  totalFiles: number;
  totalComplexity: number;
  averageComplexity: number;
  maxComplexity: number;
  filesAboveThreshold: number;
  distribution: Record<string, number>;
}
