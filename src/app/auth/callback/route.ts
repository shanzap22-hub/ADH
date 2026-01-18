import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            // CAPTURE TOKENS MANUALLY INTO METADATA
            const { session } = data;
            if (session.provider_refresh_token || session.provider_token) {
                await supabase.auth.updateUser({
                    data: {
                        google_refresh_token: session.provider_refresh_token,
                        google_access_token: session.provider_token,
                        google_token_updated: new Date().toISOString()
                    }
                });
                console.log("Tokens persisted to User Metadata for:", session.user.email);
            }

            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            let redirectPath = next

            if (next === '/') {
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .single()

                        if (profile) {
                            if (profile.role === 'student' || !profile.role) {
                                const { count } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                                if (count === 0) {
                                    await supabase.auth.signOut();
                                    return NextResponse.redirect(`${origin}/?error=unauthorized_purchase_required`);
                                }
                            }
                            if (profile.role === 'instructor') redirectPath = '/instructor/courses'
                            else if (profile.role === 'admin') redirectPath = '/dashboard'
                            else redirectPath = '/dashboard'
                        }
                    }
                } catch (e) { console.error(e) }
            }

            if (isLocalEnv) return NextResponse.redirect(`${origin}${redirectPath}`)
            else if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            else return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
