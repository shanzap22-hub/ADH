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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
    console.log('=== DIAGNOSIS START ===\n');

    // 1. Check transactions table
    console.log('1. Checking transactions table...');
    const { data: txns, error: txnError } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);

    if (txnError) {
        console.error('❌ Transactions error:', txnError.message);
    } else {
        console.log('✅ Transactions table OK. Sample count:', txns?.length || 0);
        if (txns && txns.length > 0) {
            console.log('   Sample transaction:', JSON.stringify(txns[0], null, 2));
        }
    }

    // 2. Check profiles table structure
    console.log('\n2. Checking profiles table...');
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError) {
        console.error('❌ Profiles error:', profileError.message);
    } else {
        console.log('✅ Profiles table OK');
        if (profiles && profiles.length > 0) {
            console.log('   Available columns:', Object.keys(profiles[0]).join(', '));
        }
    }

    // 3. Check user_progress table
    console.log('\n3. Checking user_progress table...');
    const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

    if (progressError) {
        console.error('❌ user_progress error:', progressError.message);
        console.log('   This table might not exist. Progress will show as "-"');
    } else {
        console.log('✅ user_progress table OK');
        if (progress && progress.length > 0) {
            console.log('   Available columns:', Object.keys(progress[0]).join(', '));
        }
    }

    // 4. Test search query
    console.log('\n4. Testing search query...');
    const { data: searchResult, error: searchError } = await supabase
        .from('transactions')
        .select('*')
        .or('student_name.ilike.%test%,student_email.ilike.%test%')
        .limit(5);

    if (searchError) {
        console.error('❌ Search query error:', searchError.message);
    } else {
        console.log('✅ Search query OK. Results:', searchResult?.length || 0);
    }

    // 5. Check if admin user exists
    console.log('\n5. Checking admin user...');
    const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', 'agent_admin@adh.today')
        .single();

    if (adminError) {
        console.error('❌ Admin profile error:', adminError.message);
    } else {
        console.log('✅ Admin user found');
        console.log('   Role:', adminProfile?.role);
        console.log('   Email:', adminProfile?.email);
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===');
}

diagnose().catch(console.error);
