const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let val = match[2].trim();
                if (val.startsWith('"')) val = val.slice(1, -1);
                process.env[match[1].trim()] = val;
            }
        });
    } catch (e) { }
}

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

// Use Service Role Key to bypass RLS and applying policies
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Applying Admin Permissions Migration...");

    const sql = `
    -- 1. Function
    create or replace function public.is_admin()
    returns boolean as $$
    begin
        return exists (
            select 1
            from profiles
            where id = auth.uid()
            and role = 'admin'
        );
    end;
    $$ language plpgsql security definer;

    -- 2. Chapters Policies
    drop policy if exists "Admins can update chapters" on chapters;
    create policy "Admins can update chapters"
    on chapters for update
    using (
        is_admin() or 
        auth.uid() in (select instructor_id from courses where id = chapters.course_id)
    );

    drop policy if exists "Admins can insert chapters" on chapters;
    create policy "Admins can insert chapters"
    on chapters for insert
    with check (
        is_admin() or 
        auth.uid() in (select instructor_id from courses where id = chapters.course_id)
    );

    -- 3. Attachments Policies
    drop policy if exists "Instructors can insert attachments" on attachments;
    drop policy if exists "Admins and Owners can insert attachments" on attachments;
    create policy "Admins and Owners can insert attachments"
    on attachments for insert
    with check (
        is_admin() or
        auth.uid() in (select instructor_id from courses where id = attachments.course_id)
    );

    drop policy if exists "Instructors can delete own course attachments" on attachments;
    drop policy if exists "Admins and Owners can delete attachments" on attachments;
    create policy "Admins and Owners can delete attachments"
    on attachments for delete
    using (
        is_admin() or
        auth.uid() in (select instructor_id from courses where id = attachments.course_id)
    );
    `;

    // Execute SQL via RPC if exposed, or just rely on Supabase JS raw query if allowed?
    // Supabase JS doesn't support raw SQL directly unless through RPC 'exec_sql' or similar custom function.
    // Assuming user doesn't have such RPC.

    // BUT we can use pg directly or just ask the user.
    // Since I can't run raw SQL easily without pg driver in node_modules (which might not be installed),
    // I will try to use the 'rpc' method IF they have a sql-runner function. Usually not.

    // Wait, the user seems to have run migrations before. 
    // I will output the SQL to console so the user can see it clearly, 
    // AND I will check if I can 'hack' it by checking if user is actually admin.

    console.log("---------------------------------------------------");
    console.log("PLEASE RUN THE FOLLOWING SQL IN SUPABASE SQL EDITOR:");
    console.log("---------------------------------------------------");
    console.log(sql);
    console.log("---------------------------------------------------");
}

run();
