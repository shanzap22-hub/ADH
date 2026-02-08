import { NextRequest, NextResponse } from 'next/server';

/**
 * 2026 Security: In-Memory Rate Limiting
 * 
 * Protects API routes from abuse, brute force attacks, and DDoS attempts.
 * Uses IP-based tracking with configurable limits per route.
 * 
 * For production at scale, consider:
 * - Redis-based rate limiting (Upstash, Vercel KV)
 * - Edge-based rate limiting (Cloudflare, Vercel Edge Config)
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

// In-memory storage (will reset on server restart)
// For production, use Redis or Vercel KV
const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup old entries every 10 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) {
            rateLimitMap.delete(key);
        }
    }
}, 10 * 60 * 1000);

export interface RateLimitOptions {
    /** Maximum number of requests allowed in the window */
    limit: number;
    /** Time window in milliseconds (default: 60000 = 1 minute) */
    windowMs?: number;
    /** Custom identifier (defaults to IP address) */
    identifier?: string;
}

/**
 * Rate limit a request
 * 
 * @param request - The Next.js request object
 * @param options - Rate limit configuration
 * @returns NextResponse with 429 status if limit exceeded, null if allowed
 * 
 * @example
 * ```ts
 * // In API route
 * const rateLimitResponse = await rateLimit(request, { limit: 5, windowMs: 60000 });
 * if (rateLimitResponse) return rateLimitResponse;
 * ```
 * 
 * @example
 * ```ts
 * // In middleware
 * if (pathname.startsWith('/api/auth')) {
 *   const rateLimitResponse = await rateLimit(request, { limit: 10 });
 *   if (rateLimitResponse) return rateLimitResponse;
 * }
 * ```
 */
export async function rateLimit(
    request: NextRequest,
    options: RateLimitOptions
): Promise<NextResponse | null> {
    const { limit, windowMs = 60000, identifier } = options;

    // Get identifier (IP address or custom key)
    const ip = identifier ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;

    // Get or create record
    const record = rateLimitMap.get(key);

    // If no record or window expired, create new record
    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return null; // Allow request
    }

    // If limit exceeded, return 429
    if (record.count >= limit) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);

        return NextResponse.json(
            {
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
                retryAfter,
            },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(limit),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.floor(record.resetAt / 1000)),
                },
            }
        );
    }

    // Increment count
    record.count++;

    // Add rate limit headers to successful responses
    return null; // Allow request
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
    /** Very strict: 5 requests per minute (auth endpoints) */
    STRICT: { limit: 5, windowMs: 60000 },

    /** Moderate: 20 requests per minute (general API) */
    MODERATE: { limit: 20, windowMs: 60000 },

    /** Generous: 100 requests per minute (public API) */
    GENEROUS: { limit: 100, windowMs: 60000 },

    /** Per-second limit: 10 requests per 10 seconds */
    PER_SECOND: { limit: 10, windowMs: 10000 },
} as const;

/**
 * Add rate limit headers to response (for successful requests)
 */
export function addRateLimitHeaders(
    response: NextResponse,
    request: NextRequest,
    options: RateLimitOptions
): NextResponse {
    const { limit, windowMs = 60000, identifier } = options;

    const ip = identifier ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        'unknown';

    const key = `${ip}:${request.nextUrl.pathname}`;
    const record = rateLimitMap.get(key);

    if (record) {
        response.headers.set('X-RateLimit-Limit', String(limit));
        response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit - record.count)));
        response.headers.set('X-RateLimit-Reset', String(Math.floor(record.resetAt / 1000)));
    }

    return response;
}
