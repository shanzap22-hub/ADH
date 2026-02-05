'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Capacitor } from '@capacitor/core'
import { App as CapacitorApp } from '@capacitor/app'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle } from 'lucide-react'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam === 'Membership Cancelled') {
            setError('Your membership has been cancelled. Access is denied. Please contact support if this is a mistake.')
        } else if (errorParam) {
            setError(decodeURIComponent(errorParam))
        }
    }, [searchParams])

    // Handle Capacitor Deep Links (OAuth Callback)
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const handleDeepLink = async (event: { url: string }) => {
            if (event.url.includes('login-callback')) {
                // Determine if it's a specific scheme match just in case
                // Convert custom scheme to HTTP url so URL object can parse it easily if needed, 
                // or just extract params.

                // Supabase PKCE flow returns 'code' in query params
                const urlObj = new URL(event.url.replace('adh://', 'https://adh.today/'));
                const code = urlObj.searchParams.get('code');
                const error = urlObj.searchParams.get('error');
                const errorDesc = urlObj.searchParams.get('error_description');

                if (error) {
                    setError(errorDesc || error);
                    setGoogleLoading(false);
                    return;
                }

                if (code) {
                    try {
                        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
                        if (sessionError) throw sessionError;

                        // Session exchanged successfully! 
                        // Proceed to fetch profile and redirect (using the same logic as handleLogin)
                        // For simplicity, we trigger a page reload or let the state update flow handle it.
                        // But better to reuse the 'fetch profile' logic.

                        // Quick verification:
                        if (data.user) {
                            // Fetch Role Logic (Duplicate of handleLogin logic, ideally refactor, but copying for safety now)
                            const { data: profile } = await supabase.from('profiles').select('role, membership_tier').eq('id', data.user.id).single();

                            if (profile?.membership_tier === 'cancelled' && profile.role !== 'super_admin') {
                                setError('Your membership has been cancelled.');
                                await supabase.auth.signOut();
                                setGoogleLoading(false);
                                return;
                            }

                            let redirectPath = '/dashboard';
                            if (profile?.role === 'instructor') redirectPath = '/instructor/courses';

                            router.push(redirectPath);
                            router.refresh();
                        }

                    } catch (err: any) {
                        setError(err.message || 'Authentication failed');
                        setGoogleLoading(false);
                    }
                } else {
                    // Implicit flow (Hash params) - Not default in Supabase v2 but handling just in case
                    // Or user clicked back.
                    setGoogleLoading(false);
                }
            }
        };

        const listener = CapacitorApp.addListener('appUrlOpen', handleDeepLink);

        return () => {
            listener.then(handle => handle.remove());
        };
    }, [router, supabase]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) {
                if (signInError.message === 'Invalid login credentials') {
                    setError('Invalid email or password')
                } else {
                    setError(signInError.message)
                }
            } else {
                // Fetch user profile to determine role
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    // Get user profile from profiles table
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role, membership_tier')
                        .eq('id', user.id)
                        .single()

                    if (profileError || !profile) {
                        setError('Could not fetch user profile')
                        setLoading(false)
                        return
                    }

                    // STRICT CHECK: Membership Cancelled
                    if (profile.membership_tier === 'cancelled' && profile.role !== 'super_admin') {
                        setError('Your membership has been cancelled. You cannot log in.')
                        await supabase.auth.signOut()
                        setLoading(false)
                        return
                    }

                    // Redirect based on role
                    let redirectPath = '/dashboard'
                    if (profile.role === 'instructor') {
                        redirectPath = '/instructor/courses'
                    } else if (profile.role === 'admin') {
                        redirectPath = '/dashboard'
                    }

                    router.push(redirectPath)
                    router.refresh()
                }
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: Capacitor.isNativePlatform()
                        ? 'adh://login-callback'
                        : `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                setError(error.message)
                setGoogleLoading(false)
            }
        } catch (err) {
            setError('Failed to sign in with Google')
            setGoogleLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-slate-950 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/20 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-500/20 blur-[100px]" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Sign in to continue to ADH Connect
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-3 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="text-sm font-medium">{error}</div>
                        </div>
                    )}

                    {/* Google OAuth Button */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mb-6 h-12 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-slate-200 transition-all active:scale-[0.98]"
                        onClick={handleGoogleLogin}
                        disabled={googleLoading || loading}
                    >
                        {googleLoading ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        )}
                        Continue with Google
                    </Button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-slate-500 font-medium">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-orange-500 h-11 transition-all focus:bg-white/10"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-slate-300">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-orange-500 h-11 transition-all focus:bg-white/10"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                            disabled={loading || googleLoading}
                        >
                            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                            Sign In
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default LoginForm;

