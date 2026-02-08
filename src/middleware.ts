import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, RateLimitPresets } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // APP CHECK: Redirect App users from Landing Page to Login to avoid Google Play Policy issues
    const userAgent = request.headers.get('user-agent') || '';
    const isApp = userAgent.includes('ADH_APP');

    if (isApp && pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

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
        '/api/coupons/validate',  // Allow coupon validation for unauthenticated users
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

    // 2026 Security: Rate Limiting for Auth & API Routes
    // Protect against brute force attacks and DDoS
    if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname === '/signup') {
        // Strict rate limit for authentication endpoints (5 requests per minute)
        const rateLimitResponse = await rateLimit(request, RateLimitPresets.STRICT);
        if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/')) {
        // Moderate rate limit for general API endpoints (20 requests per minute)
        const rateLimitResponse = await rateLimit(request, RateLimitPresets.MODERATE);
        if (rateLimitResponse) return rateLimitResponse;
    }

    // Create Supabase Client for Middleware
    const { createClient } = await import('@/lib/supabase/middleware');
    const { supabase, response } = await createClient(request);

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Enforce Mandatory Setup & Password Reset
    if (user) {
        const passwordResetRequired = user.user_metadata?.password_reset_required;
        const setupRequired = user.user_metadata?.setup_required;
        const allowedSetupPaths = [
            '/onboarding/complete',
            '/api/user/complete-profile',
            '/api/auth/send-otp',
            '/api/auth/verify-otp'
        ];

        // Allow logout/auth paths
        const isAuthRelated = pathname.startsWith('/auth') || pathname === '/signout';

        // 0. Priority: Membership Cancelled Check
        // Fetch profile to check tier
        if (!isAuthRelated && !pathname.startsWith('/api/user') && !pathname.startsWith('/api/auth')) { // Allow critical APIs
            const { data: profile } = await supabase
                .from('profiles')
                .select('membership_tier, role')
                .eq('id', user.id)
                .single();

            if (profile?.membership_tier === 'cancelled' && profile?.role !== 'super_admin') {
                console.log('[MIDDLEWARE] BLOCKING CANCELLED USER:', user.email);
                // Sign out logic is complex in middleware, so we force redirect to a specific error page or login
                // We will append a query param to login to show a specific message
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                url.searchParams.set('error', 'Membership Cancelled')
                return NextResponse.redirect(url)
            }
        }

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
        '/reschedule',
        '/courses'
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

            // If strictly cancelled, they will be caught by the check above next time or now
            // But if we are here, we redirect to dashboard, which will then trigger the cancelled check on next nav
            // Ideally we check here too but the top check handles it for protected routes.
            // For login page, we let them go to dashboard and get blocked.

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
    return response;

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
