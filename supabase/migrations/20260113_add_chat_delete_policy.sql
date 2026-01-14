-- Allow Users to delete their OWN messages
CREATE POLICY "Users can delete their own messages"
ON chat_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Allow Admins/Instructors to delete ANY message
CREATE POLICY "Admins can delete any message"
ON chat_messages FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('super_admin', 'instructor')
    )
);
