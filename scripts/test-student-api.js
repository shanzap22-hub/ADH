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

async function testAPILogic() {
    const email = 'help.avodha@gmail.com';
    console.log('=== TESTING API LOGIC FOR SCRIPT ===');
    console.log('Email:', email);

    try {
        // 1. Fetch Transaction
        const { data: transactions } = await supabase.from('transactions').select('*').eq('student_email', email);
        if (!transactions || transactions.length === 0) {
            console.log('No Transaction Found');
            return;
        }
        const transaction = transactions[0];
        console.log('Found Transaction:', transaction.id);

        // 2. Resolve User ID
        let profile = null;
        if (transaction.user_id) {
            const { data } = await supabase.from('profiles').select('*').eq('id', transaction.user_id).single();
            profile = data;
        } else if (transaction.student_email) {
            const { data } = await supabase.from('profiles').select('*').eq('email', transaction.student_email).single();
            profile = data;
        }

        const effectiveId = profile ? profile.id : transaction.user_id;
        console.log('Effective User ID:', effectiveId);
        console.log('Membership Tier (Profile):', profile?.membership_tier);
        console.log('Membership Plan (Txn):', transaction.membership_plan);

        // 3. Determine Tier
        const tier = (transaction.membership_plan || profile?.membership_tier || "").toLowerCase();
        console.log('Calculated Tier:', tier);

        // 4. Fetch Tier Access (Available Courses)
        let availableCourses = [];
        if (tier) {
            const { data: tierAccess } = await supabase
                .from('course_tier_access')
                .select('course_id')
                .eq('tier', tier);

            if (tierAccess) {
                availableCourses = tierAccess.map(t => t.course_id);
            }
        }
        console.log('Available Courses in Bundle:', availableCourses.length);
        console.log(availableCourses);

        // 5. Fetch Chapter Counts for these courses
        let totalAvailableChapters = 0;
        let courseChapterCounts = {};

        if (availableCourses.length > 0) {
            const { data: chapters } = await supabase
                .from('chapters')
                .select('course_id')
                .in('course_id', availableCourses);

            chapters.forEach(ch => {
                courseChapterCounts[ch.course_id] = (courseChapterCounts[ch.course_id] || 0) + 1;
            });

            availableCourses.forEach(cid => {
                const count = courseChapterCounts[cid] || 0;
                totalAvailableChapters += count;
                console.log(`- Course ${cid}: ${count} chapters`);
            });
        }
        console.log('Total Chapters in Bundle:', totalAvailableChapters);

        // 6. Fetch User Progress (Completed Chapters)
        let completedCount = 0;
        if (effectiveId) {
            const { data: userProgress } = await supabase
                .from('user_progress')
                .select('chapter_id')
                .eq('user_id', effectiveId)
                .eq('is_completed', true);

            completedCount = userProgress ? userProgress.length : 0;
        }
        console.log('User Completed Chapters:', completedCount);

        // 7. Calculate Percentage
        const percentage = totalAvailableChapters > 0
            ? Math.round((completedCount / totalAvailableChapters) * 100)
            : 0;

        console.log('Completion Percentage:', percentage + '%');

        console.log('\n=== JSON RESULT ===');
        console.log(JSON.stringify({
            courses_enrolled: availableCourses.length,
            total_chapters: totalAvailableChapters,
            completed_chapters: completedCount,
            completion_percentage: percentage
        }, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

testAPILogic();
