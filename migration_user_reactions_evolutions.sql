-- Migration to add user_reactions to member_evolutions table
ALTER TABLE member_evolutions ADD COLUMN IF NOT EXISTS user_reactions JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have an empty object if they are null
UPDATE member_evolutions SET user_reactions = '{}'::jsonb WHERE user_reactions IS NULL;
