-- Add deployment_plan and documentation columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deployment_plan jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS documentation jsonb;
