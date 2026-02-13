
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPersistence() {
    console.log('Testing Supabase Persistence...');

    // 1. Login
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: 'shanzap22@gmail.com',
        password: 'password'
    });

    if (authError || !user) {
        console.error('Login failed:', authError);
        return;
    }

    console.log('Logged in as:', user.id);

    // 2. Insert Message
    const content = `Persistence Test Script ${new Date().toISOString()}`;
    console.log('Inserting:', content);

    const { error: insertError } = await supabase.from('ai_chat_messages').insert({
        user_id: user.id,
        role: 'user',
        content: content
    });

    if (insertError) {
        console.error('Insert failed:', insertError);
        return;
    }

    console.log('Insert successful. Reading back IMMEDIATELY...');

    // 3. Read Message
    const { data: messages, error: readError } = await supabase
        .from('ai_chat_messages')
        .select('content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (readError) {
        console.error('Read failed:', readError);
        return;
    }

    const found = messages.find(m => m.content === content);
    if (found) {
        console.log('✅ SUCCESS: Message found immediately.');
    } else {
        console.error('❌ FAILURE: Message NOT found immediately.');
        console.log('Recent messages:', messages);
    }
}

testPersistence();
