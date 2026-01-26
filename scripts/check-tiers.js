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

async function checkSchema() {
    console.log('=== Checking course_tier_access Table ===');

    // Try to fetch a record to see columns
    const { data, error } = await supabase
        .from('course_tier_access')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log('Sample data:', data);
        console.log('Columns likely present if no error');
    }

    // Try to test RLS by deleting a non-existent record
    console.log('\nTesting Delete Permission...');
    const { error: deleteError } = await supabase
        .from('course_tier_access')
        .delete()
        .eq('course_id', 'dummy-uuid');

    if (deleteError) {
        console.error('Delete Error:', deleteError);
    } else {
        console.log('✅ Delete permission OK (Service Role)');
    }
}

checkSchema();
