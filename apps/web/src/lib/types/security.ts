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
}
