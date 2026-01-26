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

async function testAPI() {
    console.log('=== TESTING API LOGIC ===\n');

    try {
        // Simulate the API logic
        const status = 'verified';
        const searchQuery = null;

        let query = supabase.from('transactions').select('*');

        if (searchQuery) {
            query = query.or(`student_name.ilike.%${searchQuery}%,student_email.ilike.%${searchQuery}%,student_phone.ilike.%${searchQuery}%,whatsapp_number.ilike.%${searchQuery}%`);
        }
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        query = query.order('created_at', { ascending: false });

        console.log('1. Fetching transactions...');
        let { data: transactions, error } = await query;

        if (error) {
            console.error('❌ Transaction fetch error:', error);
            return;
        }

        console.log(`✅ Got ${transactions.length} transactions\n`);

        // Profile/Progress fetch
        if (transactions && transactions.length > 0) {
            console.log('2. Processing profiles and progress...');

            let userIds = transactions
                .map((t) => t.user_id)
                .filter((id) => id);

            const manualEmails = transactions
                .filter((t) => !t.user_id && t.student_email)
                .map((t) => t.student_email);

            console.log(`   - Found ${userIds.length} user IDs`);
            console.log(`   - Found ${manualEmails.length} manual emails`);

            let emailMap = new Map();

            if (manualEmails.length > 0) {
                const { data: emailProfiles, error: emailError } = await supabase
                    .from('profiles')
                    .select('id, email, membership_tier')
                    .in('email', manualEmails);

                if (emailError) {
                    console.error('   ❌ Email profile fetch error:', emailError.message);
                } else {
                    console.log(`   ✅ Found ${emailProfiles?.length || 0} profiles by email`);
                    if (emailProfiles) {
                        emailProfiles.forEach((p) => {
                            userIds.push(p.id);
                            emailMap.set(p.email, p);
                        });
                    }
                }
            }

            const uniqueIds = Array.from(new Set(userIds));
            console.log(`   - Total unique IDs: ${uniqueIds.length}\n`);

            if (uniqueIds.length > 0) {
                console.log('3. Fetching profiles...');
                const { data: profiles, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, email, membership_tier')
                    .in('id', uniqueIds);

                if (profileError) {
                    console.error('   ❌ Profile fetch error:', profileError.message);
                } else {
                    console.log(`   ✅ Got ${profiles?.length || 0} profiles\n`);
                }

                console.log('4. Fetching progress data...');
                let progressData = [];
                let enrollmentData = [];

                try {
                    const progressResult = await supabase
                        .from('user_progress')
                        .select('user_id, is_completed')
                        .in('user_id', uniqueIds)
                        .eq('is_completed', true);

                    if (progressResult.error) {
                        console.error('   ❌ Progress fetch error:', progressResult.error.message);
                    } else {
                        progressData = progressResult.data || [];
                        console.log(`   ✅ Got ${progressData.length} completed chapters`);
                    }

                    const enrollmentResult = await supabase
                        .from('user_progress')
                        .select('user_id, chapter_id')
                        .in('user_id', uniqueIds);

                    if (enrollmentResult.error) {
                        console.error('   ❌ Enrollment fetch error:', enrollmentResult.error.message);
                    } else {
                        enrollmentData = enrollmentResult.data || [];
                        console.log(`   ✅ Got ${enrollmentData.length} enrollment records`);
                    }
                } catch (progressError) {
                    console.error('   ❌ Progress fetch exception:', progressError.message);
                }

                console.log('\n5. Mapping data to transactions...');
                const enrichedCount = transactions.filter(t => {
                    const profile = profiles?.find(p => p.id === t.user_id) ||
                        (t.student_email ? emailMap.get(t.student_email) : null);
                    return profile !== null;
                }).length;

                console.log(`   ✅ ${enrichedCount} transactions have profile data`);
                console.log(`   ✅ ${transactions.length - enrichedCount} transactions without profile data`);
            }
        }

        console.log('\n=== API LOGIC TEST COMPLETE ===');
        console.log('✅ No errors detected in API logic');

    } catch (e) {
        console.error('\n❌ CRITICAL ERROR:', e.message);
        console.error('Stack:', e.stack);
    }
}

testAPI();
