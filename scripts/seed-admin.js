const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                process.env[key] = value;
            }
        });
    } catch (e) {
        // ignore
    }
}

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase Env Vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    const email = 'agent_admin@adh.today';
    const password = 'Password@123';

    console.log('Creating Admin:', email);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Agent Admin' }
    });

    let userId;

    if (error) {
        console.log('User creation msg:', error.message);
        // Try sign in to get ID
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (signInError) {
            console.error('Cannot sign in:', signInError.message);
            return;
        }
        userId = signInData.user.id;
    } else {
        userId = data.user.id;
    }

    console.log('User ID:', userId);

    // Update Profile
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        role: 'super_admin',
        full_name: 'Agent Admin',
        phone: '9999999999',
        membership_tier: 'platinum'
    });

    if (profileError) {
        console.error('Profile update failed:', profileError);
    } else {
        console.log('Profile updated to super_admin');
    }
}

run();
