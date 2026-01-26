-- Add theme column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(10) DEFAULT 'light';
