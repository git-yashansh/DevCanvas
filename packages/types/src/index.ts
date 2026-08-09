export type UserRole = "user" | "admin" | "moderator" | "support";

export type ProjectStatus = "draft" | "active" | "archived";

export type ProjectVisibility = "private" | "workspace" | "public";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  tour_completed?: boolean;
  tour_skipped?: boolean;
  tour_eligible?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  tags: string[];
  architecture?: any;
  database_schema?: any;
  api_spec?: any;
  security_report?: any;
  deployment_plan?: any;
  documentation?: any;
  specification?: any;
  created_at: string;
  updated_at: string;
}

export interface Artifact {
  id: string;
  project_id: string;
  kind: ArtifactKind;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type ArtifactKind =
  | "architecture"
  | "database-schema"
  | "er-diagram"
  | "rest-api"
  | "graphql-api"
  | "folder-structure"
  | "code"
  | "documentation"
  | "security-report"
  | "cost-estimate"
  | "devops-pipeline"
  | "deployment-guide";

export interface ChatMessage {
  id: string;
  project_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}
