import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use Admin Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS one_on_one_settings (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                instructor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
                banner_url TEXT,
                title TEXT DEFAULT '1-on-1 Strategy Call',
                features JSONB DEFAULT '["Meta & Social Media Strategy", "Automation & AI Setup", "Personal Branding Blueprint"]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            ALTER TABLE one_on_one_settings ENABLE ROW LEVEL SECURITY;

            DROP POLICY IF EXISTS "Public read access" ON one_on_one_settings;
            CREATE POLICY "Public read access" ON one_on_one_settings FOR SELECT USING (true);

            DROP POLICY IF EXISTS "Instructor/Admin update access" ON one_on_one_settings;
            CREATE POLICY "Instructor/Admin update access" ON one_on_one_settings FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE profiles.id = auth.uid()
                    AND (profiles.role = 'instructor' OR profiles.role = 'super_admin')
                )
            );
        `;

        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }); // Requires exec_sql function
        // If exec_sql doesn't exist, we can't run raw SQL via JS client easily without direct connection string or custom PG library.
        // However, usually we can use `query` or just rely on the user.

        // Since I can't guarantee `exec_sql`, I will rely on the user applying `migrations/create_one_on_one_settings.sql` manually via Supabase Dashboard SQL Editor.
        // But I will alert the user.

        return NextResponse.json({ message: "Check instructions to run migration." });
    } catch (e) {
        return NextResponse.json({ error: e });
    }
}
