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

async function testSearch() {
    console.log('=== TESTING SEARCH FUNCTIONALITY ===\n');

    const searchQuery = 'test';

    try {
        console.log('1. Testing search with query:', searchQuery);

        let query = supabase.from('transactions').select('*');

        query = query.or(`student_name.ilike.%${searchQuery}%,student_email.ilike.%${searchQuery}%,whatsapp_number.ilike.%${searchQuery}%`);

        const { data, error } = await query.limit(10);

        if (error) {
            console.error('❌ Search error:', error.message);
            console.error('Error details:', error);
        } else {
            console.log('✅ Search successful!');
            console.log('   Results found:', data?.length || 0);
            if (data && data.length > 0) {
                console.log('\n   Sample result:');
                console.log('   - Name:', data[0].student_name);
                console.log('   - Email:', data[0].student_email);
                console.log('   - Phone:', data[0].student_phone);
            }
        }

    } catch (e) {
        console.error('\n❌ EXCEPTION:', e.message);
        console.error('Stack:', e.stack);
    }
}

testSearch();
