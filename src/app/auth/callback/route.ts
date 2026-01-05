import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // If next parameter is not provided, determine redirect based on user role
            let redirectPath = next
            if (next === '/') {
                try {
                    // Fetch user profile to determine role
                    const { data: { user } } = await supabase.auth.getUser()

                    if (user) {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', user.id)
                            .single()

                        if (profile && profile.role) {
                            // Redirect based on role
                            if (profile.role === 'instructor') {
                                redirectPath = '/instructor/courses'
                            } else if (profile.role === 'admin') {
                                redirectPath = '/dashboard'
                            } else {
                                redirectPath = '/dashboard'
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error fetching profile in callback:', err)
                    // Default to /dashboard on error
                    redirectPath = '/dashboard'
                }
            }

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}${redirectPath}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
