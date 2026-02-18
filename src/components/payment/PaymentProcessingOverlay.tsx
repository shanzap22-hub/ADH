
import React from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

interface PaymentProcessingOverlayProps {
    isVisible: boolean;
}

export const PaymentProcessingOverlay: React.FC<PaymentProcessingOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">

                {/* Icon Animation */}
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
                    <div className="relative z-10 w-24 h-24 bg-gradient-to-br from-slate-900 to-slate-800 rounded-full border border-slate-700 flex items-center justify-center shadow-xl shadow-orange-500/10">
                        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                        Processing Payment...
                    </h2>

                    <p className="text-slate-400 text-lg">
                        Please wait while we complete your transaction.
                    </p>

                    <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/20 inline-block mt-6">
                        <div className="flex flex-col items-center space-y-2 text-red-200">
                            <div className="flex items-center space-x-2 font-semibold">
                                <ShieldCheck className="h-5 w-5" />
                                <span>IMPORTANT</span>
                            </div>
                            <p className="text-sm">Please do NOT close or refresh this tab.</p>
                        </div>
                    </div>
                </div>

                {/* Progress Bar (Indeterminate) */}
                <div className="w-64 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden mt-8">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-pink-600 animate-progress-indeterminate" />
                </div>
            </div>
        </div>
    );
};
