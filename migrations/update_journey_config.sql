-- Add audio_url to daily_rituals
ALTER TABLE daily_rituals ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE daily_rituals ADD COLUMN IF NOT EXISTS description TEXT;

-- Create journey_config table if not exists
CREATE TABLE IF NOT EXISTS journey_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial milestones config
INSERT INTO journey_config (key, value)
VALUES ('milestones', '["Starter", "10 Days Video", "Freedom Finisher", "HOF", "1 Cr Champion"]')
ON CONFLICT (key) DO NOTHING;
