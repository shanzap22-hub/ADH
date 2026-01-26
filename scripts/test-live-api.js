// Test live API
fetch('https://adh.today/api/admin/transactions?status=verified')
    .then(res => res.json())
    .then(data => {
        console.log('API Response:', data);

        // Find the specific student
        const student = data.find(t => t.student_email === 'help.avodha@gmail.com');

        if (student) {
            console.log('\n=== STUDENT FOUND ===');
            console.log('Email:', student.student_email);
            console.log('Progress:', student.student_progress);
        } else {
            console.log('\n⚠️  Student not found in response');
        }
    })
    .catch(err => console.error('Error:', err));
