import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * 2026 Security: Upstash Redis Rate Limiting
 * 
 * Persistent rate limiting — deploy ചെയ്താലും data retain ആകും.
 * Serverless functions-ന് across instances shared ആണ്.
 * 
 * Setup:
 * 1. https://console.upstash.com/ → Create Redis Database
 * 2. UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN → .env.local-ൽ add ചെയ്യുക
 * 
 * Fallback: Upstash credentials ഇല്ലെങ്കിൽ in-memory rate limiter ഉപയോഗിക്കും
 */

// ===== Upstash Redis Rate Limiter (Production) =====
let redisAvailable = false;
let strictLimiter: Ratelimit | null = null;
let moderateLimiter: Ratelimit | null = null;
let generousLimiter: Ratelimit | null = null;

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const redis = Redis.fromEnv();

        // Auth, payments, coupon validation — strict: 20 requests/minute
        strictLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(20, '60 s'),
            analytics: true,
            prefix: 'adh:rl:strict',
        });

        // General API — moderate: 20 requests/minute
        moderateLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(20, '60 s'),
            analytics: true,
            prefix: 'adh:rl:moderate',
        });

        // Public endpoints — generous: 100 requests/minute
        generousLimiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(100, '60 s'),
            analytics: true,
            prefix: 'adh:rl:generous',
        });

        redisAvailable = true;
        console.log('[RateLimit] ✅ Upstash Redis connected');
    }
} catch (e) {
    console.warn('[RateLimit] ⚠️ Upstash Redis not available, using in-memory fallback');
}

// ===== In-Memory Fallback (Development / Redis ഇല്ലെങ്കിൽ) =====
interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Memory cleanup — 10 minute interval
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, record] of rateLimitMap.entries()) {
            if (now > record.resetAt) {
                rateLimitMap.delete(key);
            }
        }
    }, 10 * 60 * 1000);
}

export interface RateLimitOptions {
    /** Maximum number of requests allowed in the window */
    limit: number;
    /** Time window in milliseconds (default: 60000 = 1 minute) */
    windowMs?: number;
    /** Custom identifier (defaults to IP address) */
    identifier?: string;
}

/**
 * Rate limit a request — Upstash Redis ഉണ്ടെങ്കിൽ Redis, ഇല്ലെങ്കിൽ in-memory
 */
export async function rateLimit(
    request: NextRequest,
    options: RateLimitOptions
): Promise<NextResponse | null> {
    const { limit, windowMs = 60000, identifier } = options;

    // IP address identify ചെയ്യുക
    const ip = identifier ||
        request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown';

    // ===== Upstash Redis Path =====
    if (redisAvailable) {
        try {
            // Select appropriate limiter based on limit value
            let limiter: Ratelimit;
            if (limit <= 20) {
                limiter = strictLimiter!;
            } else if (limit <= 50) {
                limiter = moderateLimiter!;
            } else {
                limiter = generousLimiter!;
            }

            const key = `${ip}:${request.nextUrl.pathname}`;
            const { success, limit: maxLimit, remaining, reset } = await limiter.limit(key);

            if (!success) {
                const retryAfter = Math.ceil((reset - Date.now()) / 1000);
                return NextResponse.json(
                    {
                        error: 'Too Many Requests',
                        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
                        retryAfter,
                    },
                    {
                        status: 429,
                        headers: {
                            'Retry-After': String(Math.max(1, retryAfter)),
                            'X-RateLimit-Limit': String(maxLimit),
                            'X-RateLimit-Remaining': '0',
                        },
                    }
                );
            }

            return null; // ✅ Request allowed
        } catch (e) {
            // Redis error ആയാൽ in-memory fallback-ലേക്ക് fall through
            console.warn('[RateLimit] Redis error, falling back to in-memory:', e);
        }
    }

    // ===== In-Memory Fallback Path =====
    const now = Date.now();
    const key = `${ip}:${request.nextUrl.pathname}`;
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
        rateLimitMap.set(key, {
            count: 1,
            resetAt: now + windowMs,
        });
        return null;
    }

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

    record.count++;
    return null;
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
    /** Very strict: 20 requests per minute (auth, payments, coupons) */
    STRICT: { limit: 20, windowMs: 60000 },

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
