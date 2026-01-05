import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Public pages - accessible without authentication
    const publicPages = [
        '/',              // Landing page
        '/contact',       // Contact page
        '/terms',         // Terms & Conditions
        '/privacy',       // Privacy Policy
        '/refund',        // Refund Policy
    ];

    // Public API routes
    const publicApiRoutes = [
        '/api/razorpay/create-order',
        '/api/razorpay/verify',
        '/api/enrollment/finalize',
        '/api/onboarding/complete',
        '/api/webhook',   // Webhooks for Razorpay/Stripe
    ];

    // Allow public pages without authentication
    if (publicPages.includes(pathname)) {
        console.log('[MIDDLEWARE] Allowing public page access:', pathname);
        return NextResponse.next();
    }

    // Allow public API routes
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
        console.log('[MIDDLEWARE] Allowing public API access:', pathname);
        return NextResponse.next();
    }

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Define public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/signup', '/forgot-password', '/auth']
    const isPublicRoute = publicRoutes.some(route =>
        pathname === route || pathname.startsWith('/auth/') || pathname.startsWith('/courses/')
    )

    // Define auth routes (login/signup)
    const authRoutes = ['/login', '/signup']
    const isAuthRoute = authRoutes.includes(pathname)

    // If user is authenticated and trying to access auth routes, redirect to dashboard
    if (user && isAuthRoute) {
        try {
            // Fetch user profile to determine role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile && profile.role) {
                // Redirect based on role
                let redirectPath = '/dashboard'
                if (profile.role === 'instructor') {
                    redirectPath = '/instructor/courses'
                } else if (profile.role === 'admin') {
                    redirectPath = '/dashboard'
                }

                return NextResponse.redirect(new URL(redirectPath, request.url))
            }
        } catch (error) {
            console.error('Error fetching profile in middleware:', error)
        }
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!user && !isPublicRoute) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
