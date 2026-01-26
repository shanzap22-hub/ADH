const https = require('https');

const url = 'https://adh.today/api/debug-student-progress';

console.log('Fetching:', url);
console.log('');

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('=== DEBUG STUDENT PROGRESS ===\n');
            console.log('Email:', json.email);
            console.log('User ID:', json.user_id);
            console.log('');
            console.log('📊 PROGRESS SUMMARY:');
            console.log('  Courses Enrolled:', json.courses_enrolled);
            console.log('  Total Chapters:', json.total_chapters_in_courses);
            console.log('  Completed Chapters:', json.completed_chapters);
            console.log('  Completion %:', json.completion_percentage + '%');
            console.log('');
            console.log('📝 PROGRESS DETAILS:');
            json.progress_details?.forEach((p, i) => {
                const status = p.completed ? '✓' : '○';
                console.log(`  ${status} ${p.course} > ${p.chapter}`);
            });
            console.log('');
            console.log('📚 ALL CHAPTERS IN COURSES:');
            const courseChapters = {};
            json.all_chapters_in_courses?.forEach(ch => {
                if (!courseChapters[ch.course_id]) {
                    courseChapters[ch.course_id] = [];
                }
                courseChapters[ch.course_id].push(ch.title);
            });
            Object.entries(courseChapters).forEach(([courseId, chapters]) => {
                console.log(`  Course ${courseId}: ${chapters.length} chapters`);
                chapters.forEach(ch => console.log(`    - ${ch}`));
            });
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw response:', data);
        }
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
