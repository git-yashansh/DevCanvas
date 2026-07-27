-- Add specification column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS specification jsonb;
