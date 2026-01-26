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

async function checkUserAccess() {
    const email = 'help.avodha@gmail.com';
    console.log('User:', email);

    // 1. Get User Tier
    const { data: profile } = await supabase.from('profiles').select('membership_tier').eq('email', email).single();
    const tier = profile?.membership_tier;
    console.log('Tier:', tier);

    if (tier) {
        // 2. Get Courses for Tier
        const { data: access } = await supabase.from('course_tier_access').select('course_id, courses(title)').eq('tier', tier);
        console.log('\nCourses in Tier:', access?.length);
        access?.forEach(a => console.log(`  - ${a.courses?.title} (${a.course_id})`));
    }
}

checkUserAccess();
