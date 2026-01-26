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

async function testNewLogic() {
    console.log('=== TESTING NEW PROGRESS LOGIC ===\n');

    try {
        // Get a sample user
        const { data: sampleProgress } = await supabase
            .from('user_progress')
            .select('user_id')
            .limit(1);

        if (!sampleProgress || sampleProgress.length === 0) {
            console.log('No user progress data found');
            return;
        }

        const userId = sampleProgress[0].user_id;
        console.log('Testing with user ID:', userId);

        // Fetch completed chapters
        const { data: progressData } = await supabase
            .from('user_progress')
            .select('user_id, is_completed, chapter_id')
            .eq('user_id', userId)
            .eq('is_completed', true);

        console.log('\n1. Completed chapters:', progressData?.length || 0);

        // Fetch enrollments with course info
        const { data: enrollmentData } = await supabase
            .from('user_progress')
            .select('user_id, chapter_id, chapters(id, course_id, courses(id, title))')
            .eq('user_id', userId);

        console.log('2. Total progress records:', enrollmentData?.length || 0);

        // Get unique courses
        const userCourses = new Set();
        enrollmentData?.forEach((e) => {
            if (e.chapters?.course_id) {
                userCourses.add(e.chapters.course_id);
                console.log('   - Course:', e.chapters.courses?.title || 'Unknown');
            }
        });

        console.log('\n3. Enrolled courses:', userCourses.size);

        // Get total chapters per course
        const courseTotalChapters = new Map();
        if (userCourses.size > 0) {
            const { data: chapterCounts } = await supabase
                .from('chapters')
                .select('course_id')
                .in('course_id', Array.from(userCourses));

            chapterCounts?.forEach((ch) => {
                const count = courseTotalChapters.get(ch.course_id) || 0;
                courseTotalChapters.set(ch.course_id, count + 1);
            });
        }

        let totalChapters = 0;
        userCourses.forEach(courseId => {
            const count = courseTotalChapters.get(courseId) || 0;
            totalChapters += count;
            console.log(`   - Course ${courseId}: ${count} chapters`);
        });

        console.log('\n4. Total chapters across all courses:', totalChapters);
        console.log('5. Completed chapters:', progressData?.length || 0);

        const completionPercentage = totalChapters > 0
            ? Math.round(((progressData?.length || 0) / totalChapters) * 100)
            : 0;

        console.log('6. Completion percentage:', completionPercentage + '%');

        console.log('\n=== FINAL RESULT ===');
        console.log({
            courses_enrolled: userCourses.size,
            total_chapters: totalChapters,
            completed_chapters: progressData?.length || 0,
            completion_percentage: completionPercentage
        });

    } catch (e) {
        console.error('\n❌ ERROR:', e.message);
        console.error('Stack:', e.stack);
    }
}

testNewLogic();
