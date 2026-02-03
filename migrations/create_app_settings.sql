CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default notification config if not exists
INSERT INTO app_settings (key, value)
VALUES (
    'notification_config', 
    '{"community_posts": true, "live_reminders": true, "live_start": true, "one_on_one": true}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Allow full access to admins" ON app_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
