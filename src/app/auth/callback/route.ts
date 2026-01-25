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
            const type = searchParams.get('type')

            // Handle Password Recovery
            if (type === 'recovery') {
                await supabase.auth.updateUser({ data: { password_reset_required: true } })
                redirectPath = '/update-password'
            } else {
                // AUTHORIZATION CHECK - Must run for ALL login attempts
                try {
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role, membership_tier')
                            .eq('id', user.id)
                            .single()

                        if (profile) {
                            if (profile.role === 'student' || !profile.role) {
                                // 1. Check if user has a valid Membership Tier assigned
                                const hasValidTier = profile.membership_tier && ['bronze', 'silver', 'gold', 'diamond', 'platinum', 'expired'].includes(profile.membership_tier);

                                if (!hasValidTier) {
                                    // 2. Fallback: Check purchases, transactions, and enrollments
                                    const { count: purchaseCount } = await supabase.from('purchases').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

                                    const { count: txCount } = await supabase
                                        .from('transactions')
                                        .select('*', { count: 'exact', head: true })
                                        .or(`user_id.eq.${user.id},student_email.eq.${user.email}`);

                                    const { count: enrollmentCount } = await supabase
                                        .from('enrollments')
                                        .select('*', { count: 'exact', head: true })
                                        .eq('student_id', user.id);

                                    // Allow if ANY of these exist
                                    const hasAccess = (purchaseCount && purchaseCount > 0) ||
                                        (txCount && txCount > 0) ||
                                        (enrollmentCount && enrollmentCount > 0);

                                    if (!hasAccess) {
                                        console.log('[AUTH_CALLBACK] Access denied - no valid enrollment/purchase/transaction');
                                        await supabase.auth.signOut();
                                        return NextResponse.redirect(`${origin}/?error=unauthorized_purchase_required`);
                                    }
                                }
                            }

                            // Determine redirect path based on role
                            if (next === '/') {
                                if (profile.role === 'instructor') redirectPath = '/instructor/courses'
                                else if (profile.role === 'admin') redirectPath = '/dashboard'
                                else redirectPath = '/dashboard'
                            } else {
                                redirectPath = next
                            }
                        } else {
                            // CRITICAL: No profile found - unauthorized access attempt
                            console.log('[AUTH_CALLBACK] Profile not found for user:', user.id);
                            await supabase.auth.signOut();
                            return NextResponse.redirect(`${origin}/?error=profile_not_found`);
                        }
                    }
                } catch (e) {
                    // CRITICAL: Authorization check failed - deny access
                    console.error('[AUTH_CALLBACK] Authorization check failed:', e);
                    await supabase.auth.signOut();
                    return NextResponse.redirect(`${origin}/?error=authorization_failed`);
                }
            }

            if (isLocalEnv) return NextResponse.redirect(`${origin}${redirectPath}`)
            else if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            else return NextResponse.redirect(`${origin}${redirectPath}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
