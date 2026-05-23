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

    // ── 1. PUBLIC PAGES & METADATA BYPASS (CPU OPTIMIZATION) ──
    // Landing page, legal pages, robots, sitemap, blog എന്നിവ കടന്നുപോകുമ്പോൾ 
    // Supabase Auth വെരിഫിക്കേഷനോ rate-limiting-ഓ ആവശ്യമില്ല. ഇത് Vercel CPU ലാഭിക്കാൻ സഹായിക്കുന്നു.
    const publicPages = [
        '/',              // Landing page
        '/contact',       // Contact page
        '/terms',         // Terms & Conditions
        '/privacy',       // Privacy Policy
        '/refund',        // Refund Policy
    ];

    if (publicPages.includes(pathname) || 
        pathname === '/sitemap.xml' || 
        pathname === '/robots.txt' || 
        pathname.startsWith('/blog')) {
        return NextResponse.next();
    }

    // ── 2. PUBLIC API & BACKGROUND CRON BYPASS (CPU OPTIMIZATION) ──
    // വെബ്ഹുക്കുകൾ (Webhooks), ക്രോൺ ജോബുകൾ (Cron Jobs) എന്നിവ സ്വയം റൺ ആകുന്നവയാണ്.
    // അവയ്ക്ക് യൂസർ സെഷന്റെയോ കുക്കികളുടെയോ ആവശ്യമില്ലാത്തതിനാൽ അവയെ ഡയറക്ട് ആയി കടത്തിവിടുന്നു.
    const publicApiRoutes = [
        '/api/razorpay/create-order',
        '/api/razorpay/verify',
        '/api/enrollment/finalize',
        '/api/coupons/validate',  // അൺഓഥന്റിക്കേറ്റഡ് യൂസേഴ്സിന് കൂപ്പൺ വാലിഡേറ്റ് ചെയ്യാൻ അനുവദിക്കുക
        '/api/webhook',   // Razorpay/Stripe വെബ്ഹുക്കുകൾ
        '/api/cron',      // ഓട്ടോമേറ്റഡ് റിമൈൻഡർ ടാസ്കുകൾ (Cron Jobs)
    ];

    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
        // കൂപ്പണുകൾ, പേയ്മെന്റ് എന്നിവ ദുരുപയോഗം ചെയ്യാതിരിക്കാൻ ഇതിൽ ചിലതിന് മാത്രം റേറ്റിലിമിറ്റ് നൽകാം.
        const strictApiPaths = ['/api/coupons/validate', '/api/razorpay', '/api/enrollment'];
        if (strictApiPaths.some(p => pathname.startsWith(p))) {
            const rateLimitResponse = await rateLimit(request, RateLimitPresets.STRICT);
            if (rateLimitResponse) return rateLimitResponse;
        }
        return NextResponse.next();
    }

    // ── 3. RATE LIMITING FOR AUTH & PROTECTED APIS ──
    // ഓതന്റിക്കേഷൻ റൂട്ടുകൾക്കും മറ്റ് പ്രൊട്ടക്റ്റഡ് എപിഐകൾക്കും റേറ്റിലിമിറ്റ് വെക്കുന്നു.
    if (pathname.startsWith('/api/auth') || pathname === '/login') {
        const rateLimitResponse = await rateLimit(request, RateLimitPresets.STRICT);
        if (rateLimitResponse) return rateLimitResponse;
    } else if (pathname.startsWith('/api/')) {
        const rateLimitResponse = await rateLimit(request, RateLimitPresets.MODERATE);
        if (rateLimitResponse) return rateLimitResponse;
    }

    // ── 4. SUPABASE SESSION REFRESH (CRITICAL) ──
    // ഡാഷ്‌ബോർഡ്, അഡ്മിൻ പാനൽ തുടങ്ങിയ പ്രൊട്ടക്റ്റഡ് പേജുകളിൽ എത്തുമ്പോൾ മാത്രം സെഷൻ പുതുക്കുന്നു.
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/middleware');
    const { supabase, response } = await createSupabaseClient(request);

    // സെഷൻ ഉണ്ടോയെന്ന് പരിശോധിക്കുന്നു
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // JWT മെറ്റാഡാറ്റയിൽ നിന്നും സ്പീഡായി റോളും മെമ്പർഷിപ്പ് ടയറും എടുക്കുന്നു
    const userRole = user?.app_metadata?.role || 'student';
    const userTier = user?.app_metadata?.membership_tier || 'free';

    // മാനിഡേറ്ററി സെറ്റപ്പും പാസ്‌വേഡ് റീസെറ്റും ഉണ്ടെങ്കിൽ നിർബന്ധമാക്കുന്നു
    if (user) {
        const passwordResetRequired = user.user_metadata?.password_reset_required;
        const setupRequired = user.user_metadata?.setup_required;
        const allowedSetupPaths = [
            '/onboarding/complete',
            '/api/user/complete-profile',
            '/api/auth/send-otp',
            '/api/auth/verify-otp'
        ];

        const isAuthRelated = pathname.startsWith('/auth') || pathname === '/signout';

        if (!isAuthRelated && !pathname.startsWith('/api/user') && !pathname.startsWith('/api/auth')) {
            if (userTier === 'cancelled' && userRole !== 'super_admin') {
                const url = request.nextUrl.clone();
                url.pathname = '/login';
                url.searchParams.set('error', 'Membership Cancelled');
                return NextResponse.redirect(url);
            }
        }

        // 1. പ്രയോറിറ്റി: പാസ്‌വേഡ് റീസെറ്റ് നിർബന്ധമാക്കുക
        if (passwordResetRequired && pathname !== '/update-password' && !isAuthRelated) {
            return NextResponse.redirect(new URL('/update-password', request.url));
        }

        // 2. പ്രയോറിറ്റി: ഒൺബോർഡിംഗ് പ്രൊഫൈൽ സെറ്റപ്പ് നിർബന്ധമാക്കുക
        if (setupRequired && !allowedSetupPaths.includes(pathname) && !isAuthRelated) {
            return NextResponse.redirect(new URL('/onboarding/complete', request.url));
        }
    }

    // പ്രൊട്ടക്റ്റഡ് പേജുകളുടെ ലിസ്റ്റ്
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

    const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
    const isProtectedApi = pathname.startsWith('/api'); // പബ്ലിക് എപിഐകളെ മുകളിൽ തന്നെ ഒഴിവാക്കിയതിനാൽ ഇവിടെ വരുന്നത് പ്രൊട്ടക്റ്റഡ് ആണ്.

    // ലോഗിൻ ചെയ്ത യൂസർ വീണ്ടും ലോഗിൻ പേജിൽ പോയാൽ ഡാഷ്‌ബോർഡിലേക്ക് തിരിച്ചുവിടുന്നു
    if (user && ['/login', '/forgot-password'].includes(pathname)) {
        let redirectPath = '/dashboard';
        if (userRole === 'instructor') redirectPath = '/instructor/courses';
        if (userRole === 'admin' || userRole === 'super_admin') redirectPath = '/admin';

        return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    // ലോഗിൻ ചെയ്യാത്ത യൂസർ പ്രൊട്ടക്റ്റഡ് പേജിൽ കയറാൻ നോക്കിയാൽ ലോഗിൻ പേജിലേക്ക് റീഡയറക്ട് ചെയ്യുക
    if (!user && (isProtectedPath || isProtectedApi)) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * താഴെ പറയുന്ന സ്റ്റാറ്റിക് ഫയലുകൾ അല്ലാത്ത എല്ലാ റൂട്ടുകളിലും മിഡിൽവെയർ റൺ ചെയ്യുക:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
