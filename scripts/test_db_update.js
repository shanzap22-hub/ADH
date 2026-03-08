const { createClient } = require('@supabase/supabase-js');

// Load environment variables manually
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTransaction() {
    console.log("Checking transaction schema and testing update...");

    // 1. Get a test transaction
    const { data: txn, error: getErr } = await supabase
        .from('transactions')
        .select('*')
        .not('amount', 'is', null)
        .limit(1)
        .single();

    if (getErr) {
        console.error("Error fetching txn:", getErr);
        return;
    }

    console.log("Sample Transaction:", { id: txn.id, amount: txn.amount, status: txn.status });

    // 2. Try updating the amount
    const newAmount = txn.amount + 100;
    console.log(`Attempting to update amount to: ${newAmount}`);

    const { data: updated, error: updateErr } = await supabase
        .from('transactions')
        .update({ amount: newAmount })
        .eq('id', txn.id)
        .select()
        .single();

    if (updateErr) {
        console.error("UPDATE ERROR:", updateErr);
    } else {
        console.log("UPDATE SUCCESS:", { id: updated.id, newAmount: updated.amount });
    }
}

checkTransaction();
