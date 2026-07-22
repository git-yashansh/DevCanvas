export type UserRole = "user" | "admin";

export type ProjectStatus = "draft" | "active" | "archived";

export type ProjectVisibility = "private" | "workspace" | "public";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
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
