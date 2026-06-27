"use client";

import { useEffect, useState } from "react";
import { X, Smartphone, ArrowRight, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface OnboardingAppPopupProps {
    show: boolean;
}

export function OnboardingAppPopup({ show }: OnboardingAppPopupProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!show) return;

        // Check if we are running inside the mobile app (User Agent contains ADH_APP)
        const isMobileApp = navigator.userAgent.includes("ADH_APP");
        if (isMobileApp) return;

        // Check if they already closed it in this session to prevent nagging
        const alreadyShown = sessionStorage.getItem("onboarding_app_popup_shown");
        if (alreadyShown === "true") return;

        setIsOpen(true);
        sessionStorage.setItem("onboarding_app_popup_shown", "true");
    }, [show]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handlePlayStoreClick = () => {
        window.open("https://play.google.com/store/apps/details?id=today.adh.app", "_blank");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden bg-slate-900 border-slate-800 text-white rounded-3xl shadow-2xl animate-in fade-in duration-300">
                {/* Visual Header Banner */}
                <div className="relative p-8 text-center bg-gradient-to-tr from-indigo-900 via-purple-900 to-pink-700 overflow-hidden border-b border-slate-800">
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/20 blur-[50px] pointer-events-none" />
                    <div className="absolute bottom-[-25%] left-[-15%] w-[45%] h-[45%] rounded-full bg-indigo-500/25 blur-[45px] pointer-events-none" />
                    
                    <div className="mx-auto w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-lg animate-bounce">
                        <Smartphone className="h-9 w-9 text-pink-400" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-200">
                        Welcome to ATCESS!
                    </h2>
                    <p className="text-white/70 text-xs mt-1.5 max-w-xs mx-auto">
                        നിങ്ങളുടെ പ്രൊഫൈൽ വിജയകരമായി സെറ്റ് ചെയ്തിരിക്കുന്നു. ഇനി പഠനം ആരംഭിക്കാം!
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex gap-3 items-start bg-slate-800/40 p-3 rounded-2xl border border-slate-800">
                            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-slate-200">ക്ലാസ്സുകൾ മൊബൈൽ ആപ്പിൽ കാണാം</h4>
                                <p className="text-xs text-slate-400 mt-0.5 leading-normal">
                                    നിങ്ങളുടെ ക്ലാസ്സുകൾ കൂടുതൽ സൗകര്യപ്രദമായി അറ്റൻഡ് ചെയ്യാൻ ഞങ്ങളുടെ ഔദ്യോഗിക മൊബൈൽ ആപ്പ് **ADH CONNECT** ഡൗൺലോഡ് ചെയ്യുക.
                                </p>
                            </div>
                        </div>

                        <div className="text-center text-xs text-slate-400 px-2 leading-relaxed">
                            ഗൂഗിൾ പ്ലേ സ്റ്റോറിൽ നിന്നും ആപ്പ് ഡൗൺലോഡ് ചെയ്ത് ഇൻസ്റ്റാൾ ചെയ്യാം. അല്ലാത്തവർക്ക് വെബ്സൈറ്റ് വഴി ക്ലാസ്സുകൾ അറ്റൻഡ് ചെയ്യാം.
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <Button
                            onClick={handlePlayStoreClick}
                            className="w-full h-12 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 active:scale-[0.99] transition-all"
                        >
                            <Download className="h-4.5 w-4.5" />
                            Download App from Play Store
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                        
                        <Button
                            variant="ghost"
                            onClick={handleClose}
                            className="w-full h-11 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-2xl text-xs font-semibold"
                        >
                            Continue on Website (വെബ്സൈറ്റ് വഴി തുടരുക)
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
