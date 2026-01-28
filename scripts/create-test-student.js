require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestStudent() {
    const email = 'bronzestudent@test.com';
    const password = 'Test123456!';

    console.log('🔍 Creating test Bronze student...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            setup_required: false
        }
    });

    if (authError) {
        console.error('❌ Auth error:', authError.message);
        return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Update profile to Bronze tier
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: 'Bronze Test Student',
            membership_tier: 'bronze',
            role: 'student'
        })
        .eq('id', authData.user.id);

    if (profileError) {
        console.error('❌ Profile error:', profileError.message);
        return;
    }

    console.log('✅ Profile updated to Bronze tier');
    console.log('\n📧 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🔗 Login at: https://adh.today/login');
}

createTestStudent().catch(console.error);
