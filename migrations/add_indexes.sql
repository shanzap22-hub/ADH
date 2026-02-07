-- Add Indexes for Performance Optimization (Verified Schema)

-- Profiles Table (Verified: 'full_name' exists, 'username' does not)
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Purchases Table (Verified)
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases(course_id);

-- User Progress Table (Verified: Table is 'user_progress')
CREATE INDEX IF NOT EXISTS idx_user_progress_user_chapter ON user_progress(user_id, chapter_id);

-- Chat Messages (Verified: Table is 'chat_messages')
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- Chat Notification Settings (Verified from chat-actions.ts)
CREATE INDEX IF NOT EXISTS idx_chat_notifications_user_conv ON chat_notification_settings(user_id, conversation_id);

-- Posts (Verified)
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Analyze tables to update statistics
ANALYZE profiles;
ANALYZE purchases;
ANALYZE user_progress;
ANALYZE chat_messages;
ANALYZE chat_notification_settings;
ANALYZE posts;
