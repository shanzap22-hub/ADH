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
    console.log('=== CHECKING DATABASE SCHEMA ===\n');

    // 1. Check chapters table
    console.log('1. Checking chapters table...');
    const { data: chapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .limit(1);

    if (chaptersError) {
        console.error('❌ Chapters error:', chaptersError.message);
    } else if (chapters && chapters.length > 0) {
        console.log('✅ Chapters table exists');
        console.log('   Columns:', Object.keys(chapters[0]).join(', '));
    }

    // 2. Check courses table
    console.log('\n2. Checking courses table...');
    const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .limit(1);

    if (coursesError) {
        console.error('❌ Courses error:', coursesError.message);
    } else if (courses && courses.length > 0) {
        console.log('✅ Courses table exists');
        console.log('   Columns:', Object.keys(courses[0]).join(', '));
    }

    // 3. Check enrollments table
    console.log('\n3. Checking enrollments table...');
    const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('*')
        .limit(1);

    if (enrollmentsError) {
        console.error('❌ Enrollments error:', enrollmentsError.message);
    } else if (enrollments && enrollments.length > 0) {
        console.log('✅ Enrollments table exists');
        console.log('   Columns:', Object.keys(enrollments[0]).join(', '));
    }

    // 4. Check user_progress structure
    console.log('\n4. Checking user_progress table structure...');
    const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .limit(1);

    if (progressError) {
        console.error('❌ user_progress error:', progressError.message);
    } else if (progress && progress.length > 0) {
        console.log('✅ user_progress table exists');
        console.log('   Columns:', Object.keys(progress[0]).join(', '));
    }

    // 5. Test getting course info from chapter
    console.log('\n5. Testing chapter -> course relationship...');
    const { data: chapterWithCourse, error: relationError } = await supabase
        .from('chapters')
        .select('id, title, course_id, courses(id, title)')
        .limit(1);

    if (relationError) {
        console.error('❌ Relation error:', relationError.message);
    } else if (chapterWithCourse && chapterWithCourse.length > 0) {
        console.log('✅ Chapter-Course relationship works');
        console.log('   Sample:', JSON.stringify(chapterWithCourse[0], null, 2));
    }

    console.log('\n=== SCHEMA CHECK COMPLETE ===');
}

checkSchema();
