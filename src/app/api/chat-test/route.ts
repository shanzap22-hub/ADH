// ⚠️ DISABLED IN PRODUCTION
// ഈ endpoint debugging-ന് മാത്രമായി ഉപയോഗിച്ചിരുന്നതാണ്.
// Security risk ആയതിനാൽ production-ൽ disable ചെയ്തിരിക്കുന്നു.

export async function POST() {
    return Response.json({
        error: 'This debug endpoint is disabled in production.',
        hint: 'Use /api/chat for AI interactions.'
    }, { status: 404 });
}
