-- Add Focus Mode columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS focus_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_notifications JSONB DEFAULT '[]'::jsonb;
