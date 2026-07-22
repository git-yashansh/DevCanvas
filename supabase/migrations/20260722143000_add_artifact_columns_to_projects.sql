-- Add columns to projects to store generated artifacts
ALTER TABLE projects ADD COLUMN IF NOT EXISTS architecture jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS database_schema jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS api_spec jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS security_report jsonb;
