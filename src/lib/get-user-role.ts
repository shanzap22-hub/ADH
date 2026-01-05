import { createClient } from '@/lib/supabase/server'

export type UserRole = 'student' | 'instructor' | 'admin'

export interface UserProfile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
    role: UserRole
    created_at: string
    updated_at: string
}

/**
 * Get the user's profile including their role from the server
 * @returns UserProfile or null if not found
 */
export async function getUserProfile(): Promise<UserProfile | null> {
    try {
        const supabase = await createClient()

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return null
        }

        // Fetch the user's profile from the profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return null
        }

        return profile as UserProfile
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
}

/**
 * Get the redirect path based on user role
 * @param role - The user's role
 * @returns The redirect path for the role
 */
export function getRoleBasedRedirect(role: UserRole): string {
    switch (role) {
        case 'instructor':
            return '/instructor/courses'
        case 'admin':
            return '/dashboard' // Can be changed to /admin if such route exists
        case 'student':
        default:
            return '/dashboard'
    }
}
