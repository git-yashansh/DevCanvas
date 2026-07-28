export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type OwaspStatus = "pass" | "fail" | "warning" | "n/a";

export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
}

export interface OwaspItem {
  id: string;
  name: string;
  status: OwaspStatus;
  notes: string;
}

export interface CategoryScore {
  name: string;
  score: number;
  status: "Secure" | "Needs Improvement" | "Critical";
}

export interface RiskFinding {
  title: string;
  level: "Critical" | "High" | "Medium" | "Low";
  likelihood: "Likely" | "Possible" | "Unlikely";
  impact: "Severe" | "Major" | "Moderate" | "Minor";
  priority: "P0" | "P1" | "P2" | "P3";
  component: string;
  status: "Open" | "Mitigated";
}

export interface ComplianceItem {
  standard: string;
  status: "Pass" | "Warning" | "Fail";
  progress: number;
  scope: string;
  recs: string;
}

export interface SecurityAnalysis {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  summary: string;
  findings: SecurityFinding[];
  owaspCoverage: OwaspItem[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  positives: string[];
  // AI-generated visualizer data (new fields from updated edge function schema)
  categoryScores?: CategoryScore[];
  riskFindings?: RiskFinding[];
  complianceItems?: ComplianceItem[];
}

