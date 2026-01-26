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

async function checkStudent() {
    const email = 'help.avodha@gmail.com';
    console.log('=== CHECKING STUDENT PROGRESS ===');
    console.log('Email:', email);
    console.log('');

    try {
        // 1. Find user profile
        console.log('1. Finding user profile...');
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (profileError) {
            console.error('❌ Profile error:', profileError.message);
            return;
        }

        console.log('✅ Profile found');
        console.log('   User ID:', profile.id);
        console.log('   Name:', profile.full_name);
        console.log('   Membership:', profile.membership_tier);

        // 2. Check transactions
        console.log('\n2. Checking transactions...');
        const { data: transactions, error: txnError } = await supabase
            .from('transactions')
            .select('*')
            .eq('student_email', email);

        if (txnError) {
            console.error('❌ Transaction error:', txnError.message);
        } else {
            console.log('✅ Transactions found:', transactions?.length || 0);
            if (transactions && transactions.length > 0) {
                transactions.forEach(t => {
                    console.log(`   - ${t.membership_plan} (${t.status}) - ${t.created_at}`);
                });
            }
        }

        // 3. Check user_progress
        console.log('\n3. Checking user_progress...');
        const { data: allProgress, error: progressError } = await supabase
            .from('user_progress')
            .select('*, chapters(id, title, course_id, courses(id, title))')
            .eq('user_id', profile.id);

        if (progressError) {
            console.error('❌ Progress error:', progressError.message);
            return;
        }

        console.log('✅ Progress records found:', allProgress?.length || 0);

        if (allProgress && allProgress.length > 0) {
            const completed = allProgress.filter(p => p.is_completed);
            console.log('   Completed chapters:', completed.length);

            console.log('\n   Details:');
            allProgress.forEach(p => {
                const status = p.is_completed ? '✓ COMPLETED' : '○ In Progress';
                const courseName = p.chapters?.courses?.title || 'Unknown Course';
                const chapterName = p.chapters?.title || 'Unknown Chapter';
                console.log(`   ${status} - ${courseName} > ${chapterName}`);
            });

            // Get unique courses
            const courses = new Set();
            allProgress.forEach(p => {
                if (p.chapters?.course_id) {
                    courses.add(p.chapters.course_id);
                }
            });

            console.log('\n   Enrolled in', courses.size, 'course(s)');

            // Get total chapters per course
            if (courses.size > 0) {
                const { data: chapterCounts } = await supabase
                    .from('chapters')
                    .select('course_id')
                    .in('course_id', Array.from(courses));

                const courseTotalChapters = new Map();
                chapterCounts?.forEach(ch => {
                    const count = courseTotalChapters.get(ch.course_id) || 0;
                    courseTotalChapters.set(ch.course_id, count + 1);
                });

                let totalChapters = 0;
                courses.forEach(courseId => {
                    totalChapters += courseTotalChapters.get(courseId) || 0;
                });

                const completionPercentage = totalChapters > 0
                    ? Math.round((completed.length / totalChapters) * 100)
                    : 0;

                console.log('\n=== EXPECTED DISPLAY ===');
                console.log('Courses Enrolled:', courses.size);
                console.log('Total Chapters:', totalChapters);
                console.log('Completed Chapters:', completed.length);
                console.log('Completion %:', completionPercentage + '%');
            }
        } else {
            console.log('⚠️  No progress records found for this user');
        }

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
        console.error('Stack:', e.stack);
    }
}

checkStudent();
