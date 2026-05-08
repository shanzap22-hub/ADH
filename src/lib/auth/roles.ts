/**
 * Role-based access control (RBAC) utilities
 * Provides helper functions to check user roles and permissions
 */

import { createClient } from "@/lib/supabase/server";

export type UserRole = 'student' | 'instructor' | 'super_admin';

/**
 * Get the current user's role
 * @returns UserRole or null if not authenticated
 */
export async function getUserRole(): Promise<UserRole | null> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        return (profile?.role as UserRole) || 'student';
    } catch (error) {
        console.error('Error fetching user role:', error);
        return null;
    }
}

/**
 * Check if the current user is a super admin
 * @returns true if super admin, false otherwise
 */
export async function isSuperAdmin(): Promise<boolean> {
    const role = await getUserRole();
    return role === 'super_admin';
}

/**
 * Check if the current user is an instructor (or super admin)
 * @returns true if instructor or super admin, false otherwise
 */
export async function isInstructor(): Promise<boolean> {
    const role = await getUserRole();
    return role === 'instructor' || role === 'super_admin';
}

/**
 * Check if the current user is a student
 * @returns true if student, false otherwise
 */
export async function isStudent(): Promise<boolean> {
    const role = await getUserRole();
    return role === 'student';
}

/**
 * Get user profile with role information
 * @returns Profile with role or null
 */
export async function getUserProfile() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        return profile;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Check if user has permission to edit a specific course
 * @param courseId - The course ID to check
 * @returns true if user can edit, false otherwise
 */
export async function canEditCourse(courseId: string): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return false;

        // Check if super admin
        const role = await getUserRole();
        if (role === 'super_admin') return true;

        // Check if course owner
        const { data: course } = await supabase
            .from('courses')
            .select('instructor_id')
            .eq('id', courseId)
            .single();

        return course?.instructor_id === user.id;
    } catch (error) {
        console.error('Error checking course edit permission:', error);
        return false;
    }
}

/**
 * Log admin action to audit log
 * @param action - Action performed
 * @param resourceType - Type of resource (course, user, etc.)
 * @param resourceId - ID of the resource
 * @param details - Additional details
 */
export async function logAdminAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // Only log if user is super admin
        const role = await getUserRole();
        if (role !== 'super_admin') return;

        await supabase.from('admin_audit_log').insert({
            admin_id: user.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: details || {},
        });
    } catch (error) {
        console.error('Error logging admin action:', error);
    }
}
