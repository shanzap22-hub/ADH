import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

/**
 * 2026 Security: API Request Validation Helper
 * 
 * Provides type-safe request validation with Zod schemas.
 * Ensures consistent error responses and prevents invalid data from reaching business logic.
 * 
 * Benefits:
 * - Type safety at runtime
 * - Consistent error response format
 * - Automatic validation before business logic
 * - Better security (prevents injection attacks through validation)
 */

export interface ValidationResult<T> {
    success: true;
    data: T;
}

export interface ValidationError {
    success: false;
    error: NextResponse;
}

/**
 * Validate request body against Zod schema
 * 
 * @param request - Next.js request object
 * @param schema - Zod validation schema
 * @returns ValidationResult with data or error response
 * 
 * @example Basic Usage
 * ```ts
 * import { validateRequest } from '@/lib/api-validator';
 * import { z } from 'zod';
 * 
 * const createUserSchema = z.object({
 *   name: z.string().min(2).max(100),
 *   email: z.string().email(),
 *   age: z.number().positive().optional(),
 * });
 * 
 * export async function POST(request: NextRequest) {
 *   const result = await validateRequest(request, createUserSchema);
 *   
 *   if (!result.success) {
 *     return result.error; // Returns formatted 400 response
 *   }
 *   
 *   const { data } = result; // Fully typed!
 *   // ... proceed with business logic
 * }
 * ```
 * 
 * @example With Detailed Validation
 * ```ts
 * const courseSchema = z.object({
 *   title: z.string().min(3, 'Title must be at least 3 characters').max(100),
 *   price: z.number().positive('Price must be positive'),
 *   category: z.enum(['digital-marketing', 'ai', 'automation']),
 *   tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed'),
 * });
 * 
 * export async function POST(request: NextRequest) {
 *   const result = await validateRequest(request, courseSchema);
 *   if (!result.success) return result.error;
 *   
 *   // TypeScript knows exact shape of data
 *   const course = await createCourse(result.data);
 *   return NextResponse.json({ course });
 * }
 * ```
 */
export async function validateRequest<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
    try {
        // Parse request body
        const body = await request.json();

        // Validate against schema
        const data = schema.parse(body);

        return {
            success: true,
            data,
        };
    } catch (error) {
        if (error instanceof ZodError) {
            // Format Zod validation errors for user
            return {
                success: false,
                error: NextResponse.json(
                    {
                        error: 'Validation failed',
                        message: 'The request data is invalid. Please check the fields and try again.',
                        issues: error.errors.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                            code: err.code,
                        })),
                    },
                    { status: 400 }
                ),
            };
        }

        if (error instanceof SyntaxError) {
            // Invalid JSON
            return {
                success: false,
                error: NextResponse.json(
                    {
                        error: 'Invalid JSON',
                        message: 'Request body must be valid JSON',
                    },
                    { status: 400 }
                ),
            };
        }

        // Unexpected error
        console.error('[API Validator] Unexpected error:', error);
        return {
            success: false,
            error: NextResponse.json(
                {
                    error: 'Invalid request',
                    message: 'The request could not be processed',
                },
                { status: 400 }
            ),
        };
    }
}

/**
 * Validate query parameters
 * 
 * @param request - Next.js request object
 * @param schema - Zod validation schema for query params
 * 
 * @example
 * ```ts
 * const querySchema = z.object({
 *   page: z.string().regex(/^\d+$/).transform(Number).optional(),
 *   limit: z.string().regex(/^\d+$/).transform(Number).optional(),
 *   search: z.string().optional(),
 * });
 * 
 * export async function GET(request: NextRequest) {
 *   const result = await validateQueryParams(request, querySchema);
 *   if (!result.success) return result.error;
 *   
 *   const { page = 1, limit = 20, search } = result.data;
 *   // ... fetch data with validated params
 * }
 * ```
 */
export async function validateQueryParams<T>(
    request: NextRequest,
    schema: ZodSchema<T>
): Promise<ValidationResult<T> | ValidationError> {
    try {
        // Convert URLSearchParams to object
        const params: Record<string, string> = {};
        request.nextUrl.searchParams.forEach((value, key) => {
            params[key] = value;
        });

        // Validate against schema
        const data = schema.parse(params);

        return {
            success: true,
            data,
        };
    } catch (error) {
        if (error instanceof ZodError) {
            return {
                success: false,
                error: NextResponse.json(
                    {
                        error: 'Invalid query parameters',
                        message: 'The query parameters are invalid',
                        issues: error.errors.map((err) => ({
                            field: err.path.join('.'),
                            message: err.message,
                        })),
                    },
                    { status: 400 }
                ),
            };
        }

        return {
            success: false,
            error: NextResponse.json(
                {
                    error: 'Invalid query parameters',
                    message: 'Could not process query parameters',
                },
                { status: 400 }
            ),
        };
    }
}

/**
 * Common validation schemas for reuse
 */
export const CommonSchemas = {
    /** Pagination parameters */
    pagination: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).default('1'),
        limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
    }),

    /** MongoDB/UUID ID */
    id: z.string().uuid().or(z.string().regex(/^[a-f\d]{24}$/i)),

    /** Email validation */
    email: z.string().email().toLowerCase(),

    /** Phone number (international format) */
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),

    /** Date string (ISO 8601) */
    isoDate: z.string().datetime(),

    /** URL validation */
    url: z.string().url(),
} as const;
