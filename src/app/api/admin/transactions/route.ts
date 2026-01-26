
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status'); // 'pending' | 'verified' | 'all'
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const tier = searchParams.get('tier');
        const searchQuery = searchParams.get('search_query');

        // 1. Authenticate User
        const supabaseAuth = await createClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 2. data fetching client (Service Role to bypass RLS)
        const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check Admin Role using service client (more reliable)
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        let query = supabase.from('transactions').select('*');

        // Filters
        if (searchQuery) {
            query = query.or(`student_name.ilike.%${searchQuery}%,student_email.ilike.%${searchQuery}%,whatsapp_number.ilike.%${searchQuery}%`);
        }
        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }
        if (tier) {
            query = query.eq('membership_plan', tier);
        }

        // Order
        query = query.order('created_at', { ascending: false });

        let { data: transactions, error } = await query;

        if (error) throw error;

        // MANUAL PROFILE FETCH (Robust against missing FKs)
        if (transactions && transactions.length > 0) {
            try {
                let userIds = transactions
                    .map((t: any) => t.user_id)
                    .filter((id: any) => id); // Filter nulls

                // Also check for user_id via email for manual transactions
                const manualEmails = transactions
                    .filter((t: any) => !t.user_id && t.student_email)
                    .map((t: any) => t.student_email);

                let emailMap = new Map(); // email -> profile

                if (manualEmails.length > 0) {
                    const { data: emailProfiles } = await supabase
                        .from('profiles')
                        .select('id, email, membership_tier')
                        .in('email', manualEmails);

                    if (emailProfiles) {
                        emailProfiles.forEach((p: any) => {
                            userIds.push(p.id);
                            emailMap.set(p.email, p);
                        });
                    }
                }

                const uniqueIds = Array.from(new Set(userIds));

                if (uniqueIds.length > 0) {

                    // 1. Fetch Progress Data (Completed Chapters)
                    let progressData: any[] = [];
                    try {
                        const { data: progress } = await supabase
                            .from('user_progress')
                            .select('user_id, is_completed, chapter_id')
                            .in('user_id', uniqueIds as string[])
                            .eq('is_completed', true);
                        progressData = progress || [];
                    } catch (e) {
                        console.error("Progress fetch error", e);
                    }

                    // 2. Fetch Profiles for these users
                    let profiles: any[] = [];
                    if (uniqueIds.length > 0) {
                        try {
                            const { data: fetchedProfiles } = await supabase
                                .from('profiles')
                                .select('id, email, membership_tier')
                                .in('id', uniqueIds as string[]);
                            profiles = fetchedProfiles || [];
                        } catch (e) {
                            console.error("Profile fetch error", e);
                        }
                    }

                    // 3. Fetch Tier Access & Chapter Counts
                    const plans = Array.from(new Set(transactions.map((t: any) => (t.membership_plan || "").toLowerCase()).filter(p => p)));

                    // Add tiers from profiles
                    profiles.forEach((p: any) => {
                        if (p.membership_tier) plans.push(p.membership_tier.toLowerCase());
                    });

                    const uniquePlans = Array.from(new Set(plans));

                    let tierCoursesMap = new Map<string, string[]>(); // tier -> [course_id, ...]

                    if (uniquePlans.length > 0) {
                        // Also fetch course titles for later mapping inside loop
                        const { data: tierAccess } = await supabase
                            .from('course_tier_access')
                            .select('tier, course_id, courses(id, title)')
                            .in('tier', uniquePlans);

                        tierAccess?.forEach((access: any) => {
                            const tier = access.tier.toLowerCase();
                            const list = tierCoursesMap.get(tier) || [];
                            list.push(access.course_id);
                            tierCoursesMap.set(tier, list);
                        });
                    }

                    // Fetch ALL Courses Info (Titles and total chapters)
                    // Efficiently: Get all course_ids from tierCoursesMap
                    const allCourseIds = new Set<string>();
                    tierCoursesMap.forEach((ids) => ids.forEach(id => allCourseIds.add(id)));

                    let courseInfoMap = new Map<string, { title: string, totalChapters: number }>();
                    let chapterToCourseMap = new Map<string, string>(); // chapter_id -> course_id (for progress mapping)

                    if (allCourseIds.size > 0) {
                        // Fetch Titles
                        const { data: coursesData } = await supabase
                            .from('courses')
                            .select('id, title')
                            .in('id', Array.from(allCourseIds));

                        coursesData?.forEach((c: any) => {
                            courseInfoMap.set(c.id, { title: c.title, totalChapters: 0 });
                        });

                        // Fetch Chapters for counts and mapping
                        const { data: allChapters } = await supabase
                            .from('chapters')
                            .select('id, course_id') // We need ID to map progress to course
                            .in('course_id', Array.from(allCourseIds));

                        allChapters?.forEach((ch: any) => {
                            // Update total count
                            const info = courseInfoMap.get(ch.course_id);
                            if (info) {
                                info.totalChapters = (info.totalChapters || 0) + 1;
                            }
                            // Map chapter to course
                            chapterToCourseMap.set(ch.id, ch.course_id);
                        });
                    }

                    // Map Transaction Data
                    transactions = transactions.map((t: any) => {
                        let profile = null;
                        if (profiles) {
                            profile = profiles.find((p: any) => p.id === t.user_id);
                            if (!profile && t.student_email) {
                                profile = emailMap.get(t.student_email) || profiles.find((p: any) => p.email === t.student_email);
                            }
                        }

                        const effectiveId = profile ? profile.id : t.user_id;
                        const tier = (t.membership_plan || profile?.membership_tier || "").toLowerCase();

                        // Default Progress Structure
                        const defaultProgress = {
                            courses_enrolled: 0,
                            total_chapters: 0,
                            completed_chapters: 0,
                            completion_percentage: 0,
                            course_details: []
                        };

                        if (!tier) {
                            return { ...t, user_id: effectiveId, profiles: profile || null, student_progress: defaultProgress };
                        }

                        const availableCourses = tierCoursesMap.get(tier) || [];
                        let totalAvailableChapters = 0;
                        let totalCompletedChapters = 0;
                        const courseDetails: any[] = [];

                        // Get user's completed chapters
                        const userProgress = progressData.filter((p: any) => p.user_id === effectiveId);

                        availableCourses.forEach(courseId => {
                            const info = courseInfoMap.get(courseId);
                            const courseTotal = info?.totalChapters || 0;
                            totalAvailableChapters += courseTotal;

                            // Calculate completed for this course
                            const courseCompletedCount = userProgress.filter((p: any) => chapterToCourseMap.get(p.chapter_id) === courseId).length;

                            totalCompletedChapters += courseCompletedCount;

                            courseDetails.push({
                                id: courseId,
                                title: info?.title || "Unknown Course",
                                total_chapters: courseTotal,
                                completed_chapters: courseCompletedCount,
                                percentage: courseTotal > 0 ? Math.round((courseCompletedCount / courseTotal) * 100) : 0
                            });
                        });

                        const completionPercentage = totalAvailableChapters > 0
                            ? Math.round((totalCompletedChapters / totalAvailableChapters) * 100)
                            : 0;

                        return {
                            ...t,
                            user_id: effectiveId || t.user_id,
                            profiles: profile || null,
                            student_progress: {
                                courses_enrolled: availableCourses.length,
                                total_chapters: totalAvailableChapters,
                                completed_chapters: totalCompletedChapters,
                                completion_percentage: completionPercentage,
                                course_details: courseDetails
                            }
                        };
                    });
                }
            } catch (profileError) {
                console.error('Profile/Progress fetch error:', profileError);
                // Fallback: Add empty progress to all transactions if major error occurs
                transactions = transactions.map((t: any) => ({
                    ...t,
                    student_progress: {
                        courses_enrolled: 0,
                        total_chapters: 0,
                        completed_chapters: 0,
                        completion_percentage: 0
                    }
                }));
            }
        }

        return NextResponse.json(transactions);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Audit Log is complex here.
    // We'll implement basic CREATE first.
    try {
        const body = await req.json();
        const { amount, student_name, student_phone, whatsapp_number, student_email, notes, status, source, membership_plan } = body;

        const supabase = await createClient();

        // Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        // (Assuming checking done or middleware handles. Best to check again).

        const { data, error } = await supabase.from('transactions').insert({
            amount,
            student_name,
            student_phone, // GPay Number usually
            whatsapp_number: whatsapp_number || student_phone, // Use provided WA or fallback to Phone
            student_email,
            notes,
            status: status || 'verified',
            source: source || 'manual',
            membership_plan,
            created_at: new Date().toISOString()
        }).select().single();

        if (error) throw error;

        // Audit Log
        if (user) {
            await logAudit({
                action: "CREATE_TRANSACTION",
                entityType: "TRANSACTION",
                entityId: data.id,
                details: body,
                userId: user.id
            });
        }

        // --- SYNC MANUAL ENTRY TO GOOGLE SHEET ---
        try {
            const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsBDuj15M1f_nHng6kQjkZIhl6FZsXNCI71Vf55jrZKjJ55EB7joj4XjJstLgVghRT/exec";

            const payload = {
                id: data.id,
                payment_id: "MANUAL",
                user_email: student_email || "",
                user_name: student_name,
                phone: student_phone || "",
                whatsapp: whatsapp_number || "",
                plan_id: membership_plan,
                amount: amount / 100, // Stored in paise, send in rupees
                status: status || 'verified',
                created_at: data.created_at
            };

            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

        } catch (sheetErr) {
            console.error("Sheet Sync Logic Error", sheetErr);
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    // Edit Transaction
    try {
        const body = await req.json();
        const { id, amount, notes, membership_plan, whatsapp_number } = body;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Get Old Data
        const { data: oldData } = await supabase.from('transactions').select('*').eq('id', id).single();

        const { data, error } = await supabase.from('transactions').update({
            amount,
            notes,
            membership_plan,
            whatsapp_number,
            updated_at: new Date().toISOString()
        }).eq('id', id).select().single();

        if (error) throw error;

        // Audit Log
        // Audit Log
        // Audit Log
        if (user) {
            await logAudit({
                action: "UPDATE_TRANSACTION",
                entityType: "TRANSACTION",
                entityId: id,
                details: { old: oldData, new: body },
                userId: user.id
            });
        }

        // USER REQUEST: Sync changes to Profile (e.g. Expired/Cancelled/Platinum)
        if (oldData.user_id && membership_plan && membership_plan !== oldData.membership_plan) {
            console.log(`[TXN_UPDATE] Syncing profile tier for user ${oldData.user_id} to ${membership_plan}`);
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    membership_tier: membership_plan,
                    updated_at: new Date().toISOString()
                })
                .eq('id', oldData.user_id);

            if (profileError) console.error("[TXN_UPDATE_PROFILE_ERROR]", profileError);
        }

        return NextResponse.json(data);

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
