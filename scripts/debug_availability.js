
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manual .env loading
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, val] = line.split('=');
        if (key && val) {
            process.env[key.trim()] = val.trim().replace(/"/g, '');
        }
    });
} catch (e) {
    console.error("Could not read .env.local");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Availability Logic...");

    // 1. Get Instructor
    const { data: instructors, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .in('role', ['instructor', 'admin', 'super_admin']);

    if (error) {
        console.error("Error fetching instructors:", error);
        return;
    }

    console.log("Instructors Found:", instructors.length);
    instructors.forEach(i => console.log(`- ${i.email} (${i.role}) ID: ${i.id}`));

    if (instructors.length === 0) return;

    // Check slots for the first one (or specifically shanzap22 if found)
    const target = instructors.find(i => i.email.includes('shanzap')) || instructors[0];
    console.log("\nChecking slots for:", target.email);

    const { data: slots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('instructor_id', target.id)
        .eq('is_active', true);

    console.log("Slots configuration found:", slots?.length);
    if (slots) {
        slots.forEach(s => console.log(`  Day ${s.day_of_week}: ${s.start_time} - ${s.end_time}`));
    }

    // Check Overrides
    const { data: overrides } = await supabase
        .from('availability_overrides')
        .select('*')
        .eq('instructor_id', target.id);

    console.log("Overrides found:", overrides?.length);

    // Check logic
    // If slots > 0, API should return dates.
}

test();
