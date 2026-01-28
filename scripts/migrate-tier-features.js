require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
    console.log('🔄 Running migration: Split Community + Add Booking Access...\n');

    try {
        // Step 1: Add new columns
        console.log('Step 1: Adding new columns...');
        const { error: alterError } = await supabase.rpc('exec_sql', {
            sql: `
                ALTER TABLE tier_pricing 
                ADD COLUMN IF NOT EXISTS has_community_feed_access BOOLEAN DEFAULT true,
                ADD COLUMN IF NOT EXISTS has_community_chat_access BOOLEAN DEFAULT true,
                ADD COLUMN IF NOT EXISTS has_booking_access BOOLEAN DEFAULT true;
            `
        });

        if (alterError) {
            console.error('❌ Error adding columns:', alterError.message);
            // Continue anyway - columns might already exist
        } else {
            console.log('✅ Columns added successfully');
        }

        // Step 2: Migrate existing data
        console.log('\nStep 2: Migrating existing data...');
        const { data: tiers, error: fetchError } = await supabase
            .from('tier_pricing')
            .select('*');

        if (fetchError) {
            console.error('❌ Error fetching tiers:', fetchError.message);
            return;
        }

        console.log(`Found ${tiers.length} tiers to update`);

        // Step 3: Update each tier
        for (const tier of tiers) {
            const updates = {
                has_community_feed_access: tier.has_community_access ?? true,
                has_community_chat_access: tier.has_community_access ?? true,
                has_booking_access: tier.tier_name === 'bronze' ? false : true
            };

            const { error: updateError } = await supabase
                .from('tier_pricing')
                .update(updates)
                .eq('tier', tier.tier);

            if (updateError) {
                console.error(`❌ Error updating ${tier.tier_name}:`, updateError.message);
            } else {
                console.log(`✅ Updated ${tier.tier_name}: Feed=${updates.has_community_feed_access}, Chat=${updates.has_community_chat_access}, Booking=${updates.has_booking_access}`);
            }
        }

        // Step 4: Verify
        console.log('\n📊 Final State:');
        const { data: finalTiers } = await supabase
            .from('tier_pricing')
            .select('tier_name, has_community_feed_access, has_community_chat_access, has_ai_access, has_weekly_live_access, has_booking_access')
            .order('price', { ascending: true });

        console.table(finalTiers);

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    }
}

runMigration();
