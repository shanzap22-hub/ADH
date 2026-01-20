const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://idlvnncaqmiixwnyleci.supabase.co";
// Need service key. Assuming checking env or using the one from previous file view
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHZubmNhcW1paXh3bnlsZWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ0MTMxNSwiZXhwIjoyMDgzMDE3MzE1fQ.05rCDxyXHvJ5w7uwHClsTHNl1_Nd4HK10khIu9-TFHU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
    const email = `admin_${Date.now()}@adh.test`;
    const password = 'password123';

    console.log(`Creating admin: ${email}`);

    // Create User
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Test Admin" }
    });

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    console.log('User created. Updating profile role...');

    // Give time for trigger if any
    await new Promise(r => setTimeout(r, 2000));

    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'super_admin' })
        .eq('id', data.user.id);

    if (profileError) {
        console.error('Error updating profile:', profileError);
    } else {
        console.log('SUCCESS_ADMIN_CREATED');
        console.log(`EMAIL: ${email}`);
        console.log(`PASSWORD: ${password}`);
    }
}

createAdmin();
