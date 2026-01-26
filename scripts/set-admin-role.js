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

async function run() {
    const email = 'agent_admin@adh.today';

    // Get ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found, previous run failed?');
        return;
    }

    console.log('User ID:', user.id);

    // Update Profile - minimal fields
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        email: email,
        role: 'super_admin'
    });

    if (profileError) {
        console.error('Profile update failed:', profileError);
    } else {
        console.log('Profile updated to super_admin successfully');
    }
}

run();
