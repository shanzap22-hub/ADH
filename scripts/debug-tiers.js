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

async function checkTiers() {
    console.log('=== Checking Tier Data ===');

    // 1. Check Course Tier Access
    const { data: tiers, error } = await supabase
        .from('course_tier_access')
        .select('tier, course_id');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Found records:', tiers.length);
    const uniqueTiers = [...new Set(tiers.map(t => t.tier))];
    console.log('Unique Tiers in DB:', uniqueTiers); // This will show us if it is 'Bronze' or 'bronze'

    // 2. Check a transaction plan
    const { data: txns } = await supabase
        .from('transactions')
        .select('membership_plan')
        .limit(5);

    console.log('\nTransaction Plans:', txns.map(t => t.membership_plan));
}

checkTiers();
