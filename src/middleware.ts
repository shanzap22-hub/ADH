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
        '/api/cron',      // Automated tasks (Reminders)
    ];

    // Allow public pages without authentication
    if (publicPages.includes(pathname)) {
        console.log('[MIDDLEWARE] Allowing public page access:', pathname);
        return NextResponse.next();
    }

    // Allow SEO files and Blog
    if (pathname === '/sitemap.xml' || pathname === '/robots.txt' || pathname.startsWith('/blog')) {
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

    // Enforce Mandatory Setup & Password Reset
    if (user) {
        const passwordResetRequired = user.user_metadata?.password_reset_required;
        const setupRequired = user.user_metadata?.setup_required;
        const allowedSetupPaths = ['/onboarding/complete', '/api/user/complete-profile'];

        // Allow logout/auth paths to let them escape if needed
        const isAuthRelated = pathname.startsWith('/auth') || pathname === '/signout';

        // 1. Priority: Password Reset Lockdown
        // Prevent access to ANY page except update-password until reset is done
        if (passwordResetRequired && pathname !== '/update-password' && !isAuthRelated) {
            console.log('[MIDDLEWARE] Lockdown: Redirecting to update-password:', pathname);
            return NextResponse.redirect(new URL('/update-password', request.url));
        }

        // 2. Priority: Setup Required
        if (setupRequired && !allowedSetupPaths.includes(pathname) && !isAuthRelated) {
            console.log('[MIDDLEWARE] Redirecting to setup:', pathname);
            return NextResponse.redirect(new URL('/onboarding/complete', request.url));
        }
    }

    // Define public routes that don't require authentication
    // --- NEW LOGIC: PROTECTED ROUTES STRATEGY ---

    // Explicitly protected paths
    const protectedPaths = [
        '/dashboard',
        '/admin',
        '/instructor',
        '/onboarding',
        '/update-password',
        '/settings',
        '/profile',
        '/live',
        '/chat',
        '/community',
        '/search',
        '/book-session',
        '/reschedule'
    ];

    // Check if current path is protected
    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

    // Check if it's a protected API route (Starts with /api AND NOT in publicApiRoutes)
    const isProtectedApi = pathname.startsWith('/api') && !publicApiRoutes.some(route => pathname.startsWith(route));

    // Handle Auth Redirects (If user is logged in, keep them away from login/signup)
    if (user && ['/login', '/signup', '/forgot-password'].includes(pathname)) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            let redirectPath = '/dashboard';
            if (profile?.role === 'instructor') redirectPath = '/instructor/courses';

            return NextResponse.redirect(new URL(redirectPath, request.url));
        } catch (e) {
            // Ignore error
        }
    }

    // BLOCK ACCESS if not authenticated and trying to access protected route
    if (!user && (isProtectedPath || isProtectedApi)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Allow everything else (Landing, Redirects, Public Pages)
    return NextResponse.next();

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
