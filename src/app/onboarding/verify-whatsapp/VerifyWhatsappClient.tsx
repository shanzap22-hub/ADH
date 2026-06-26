'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, Phone } from 'lucide-react'
import { toast } from 'sonner'

export default function VerifyWhatsappClient() {
    const [whatsappInput, setWhatsappInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dbWhatsapp, setDbWhatsapp] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    // token_hash param കയ്ക്കലാൻ — സേഫ് ആയിറ്റ് മൾപ്പ ലിങ്ക്കിൽ ബേക്കുന്ന format
    const urlTokenHash = searchParams.get('token_hash')
    const urlEmail = searchParams.get('email')
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        async function loadProfileForUser(user: any) {
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('whatsapp_number, setup_required')
                    .eq('id', user.id)
                    .single();

                if (!isMounted) return;

                if (profileError || !profile) {
                    setError('പ്രൊഫൈൽ വിവരങ്ങൾ കണ്ടെത്താൻ സാധിച്ചില്ല. ദയവായി അഡ്മിനുമായി ബന്ധപ്പെടുക.');
                    setLoading(false);
                    return;
                }

                // ഒൺബോർഡിംഗ് ഇതിനകം കഴിഞ്ഞതാണെങ്കിൽ ഡാഷ്ബോർഡിലേക്ക് വിടുക
                if (profile.setup_required === false) {
                    router.push('/dashboard');
                    return;
                }

                setDbWhatsapp(profile.whatsapp_number || '');
                setLoading(false);
            } catch (err) {
                if (!isMounted) return;
                console.error(err);
                setError('പ്രൊഫൈൽ വിവരങ്ങൾ ലോഡ് ചെയ്യുന്നതിൽ തകരാർ സംഭവിച്ചു.');
                setLoading(false);
            }
        }

        // Listen for auth state change (in case of async hash/token parsing)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user && isMounted) {
                loadProfileForUser(session.user);
            }
        });

        // Initial session check
        async function checkSession() {
            if (urlTokenHash && urlEmail) {
                console.log("[VerifyWhatsapp] token_hash and Email found in URL. Verifying OTP...");
                // token_hash + type 'email' — ഇതാണ് Supabase ആവശ്യപ്പെടുന്ന ശരിയായ format
                const { error: otpError } = await supabase.auth.verifyOtp({
                    token_hash: urlTokenHash,
                    type: 'email'
                });
                
                if (otpError) {
                    console.error("[VerifyWhatsapp] OTP verification failed:", otpError);
                    setError('ലോഗിൻ ചെയ്യാൻ സാധിച്ചില്ല. ലിങ്ക്ക് കാലാവധി കഴിഞ്ഞതോ ഉപയോഗിച്ചതോ ആകാം.');
                    setLoading(false);
                    return;
                }
                
                console.log("[VerifyWhatsapp] OTP verification succeeded. Fetching session...");
            }

            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user && isMounted) {
                loadProfileForUser(session.user);
            } else {
                // Wait for potential client-side hash parsing
                setTimeout(async () => {
                    if (!isMounted) return;
                    const { data: { session: delayedSession } } = await supabase.auth.getSession();
                    if (delayedSession?.user && isMounted) {
                        loadProfileForUser(delayedSession.user);
                    } else if (isMounted) {
                        setError('ലോഗിൻ ചെയ്യാൻ സാധിച്ചില്ല. ദയവായി അഡ്മിൻ നൽകിയ ലിങ്ക് വീണ്ടും ഉപയോഗിക്കുക.');
                        setLoading(false);
                    }
                }, 2500);
            }
        }

        checkSession();

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setVerifying(true)

        if (!whatsappInput.trim()) {
            setError('ദയവായി നിങ്ങളുടെ വാട്സാപ്പ് നമ്പർ എന്റർ ചെയ്യുക.')
            setVerifying(false)
            return
        }

        if (!dbWhatsapp) {
            setError('നിങ്ങളുടെ പേയ്മെന്റ് റെക്കോർഡിൽ വാട്സാപ്പ് നമ്പർ കണ്ടെത്തിയിട്ടില്ല. അഡ്മിനെ ബന്ധപ്പെടുക.')
            setVerifying(false)
            return
        }

        // അക്കങ്ങൾ മാത്രം വേർതിരിച്ചെടുക്കുന്നു (Sanitise numbers)
        const cleanInput = whatsappInput.replace(/\D/g, '')
        const cleanDB = dbWhatsapp.replace(/\D/g, '')

        // ഫോൺ നമ്പറുകൾ തമ്മിൽ മാച്ച് ചെയ്യുന്നുണ്ടോ എന്ന് പരിശോധിക്കുന്നു (രാജ്യത്തിന്റെ കോഡ് ഉണ്ടെങ്കിലും ഇല്ലെങ്കിലും ശരിയായി പ്രവർത്തിക്കും)
        const isMatch = cleanInput === cleanDB || 
                        (cleanInput.length >= 10 && cleanDB.endsWith(cleanInput)) || 
                        (cleanDB.length >= 10 && cleanInput.endsWith(cleanDB))

        if (isMatch) {
            // സെഷൻ വെരിഫിക്കേഷൻ സ്റ്റേറ്റ് സെറ്റ് ചെയ്യുന്നു (Verification flag in Session Storage)
            sessionStorage.setItem('whatsapp_verified', 'true')
            toast.success('വെരിഫിക്കേഷൻ വിജയകരമായി പൂർത്തിയായി!')
            
            // ഒൺബോർഡിംഗ് പേജിലേക്ക് റീഡയറക്ട് ചെയ്യുന്നു
            router.push('/onboarding/complete')
        } else {
            setError('നമ്പർ തെറ്റാണ്. ദയവായി പേയ്മെന്റ് സമയത്ത് നൽകിയ ശരിയായ വാട്സാപ്പ് നമ്പർ നൽകുക.')
            setVerifying(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
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
                    <div className="mx-auto my-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-full w-fit">
                        <Phone className="h-6 w-6 text-orange-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                        Verify WhatsApp Number
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        സെക്യൂരിറ്റി ആവശ്യങ്ങൾക്കായി നിങ്ങളുടെ വാട്സാപ്പ് നമ്പർ നൽകി വെരിഫൈ ചെയ്യുക.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-400 flex items-center gap-3 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <div className="text-sm font-medium">{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleVerify} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="whatsapp" className="text-slate-300">WhatsApp Number</Label>
                            <Input
                                id="whatsapp"
                                type="tel"
                                placeholder="ഉദാഹരണത്തിന്: 9876543210"
                                value={whatsappInput}
                                onChange={(e) => setWhatsappInput(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus-visible:ring-orange-500 h-11 transition-all focus:bg-white/10"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                            disabled={verifying}
                        >
                            {verifying ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    വെരിഫൈ ചെയ്യുന്നു...
                                </>
                            ) : (
                                'Verify & Continue'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
