const { createClient } = require('@supabase/supabase-js');

// Hardcode keys from .env.local view (simplified for this script execution)
const supabaseUrl = "https://idlvnncaqmiixwnyleci.supabase.co";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkbHZubmNhcW1paXh3bnlsZWNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ0MTMxNSwiZXhwIjoyMDgzMDE3MzE1fQ.05rCDxyXHvJ5w7uwHClsTHNl1_Nd4HK10khIu9-TFHU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUser() {
    const email = `test_${Date.now()}@adh.test`;
    const password = 'password123';

    console.log(`Creating user: ${email}`);

    // Create User
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { setup_required: true, password_changed: false }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('SUCCESS_USER_CREATED');
        console.log(`EMAIL: ${email}`);
        console.log(`PASSWORD: ${password}`);
    }
}

createUser();
