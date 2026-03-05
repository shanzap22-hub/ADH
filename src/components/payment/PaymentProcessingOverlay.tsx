import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface PaymentProcessingOverlayProps {
    isVisible: boolean;
}

export const PaymentProcessingOverlay: React.FC<PaymentProcessingOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-white sm:bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-lg w-full bg-white sm:shadow-2xl sm:rounded-3xl sm:border border-slate-100 p-8 sm:p-12 text-center space-y-10 animate-in fade-in zoom-in duration-300">
                {/* Icon Animation */}
                <div className="relative mx-auto w-28 h-28">
                    <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping" />
                    <div className="relative z-10 w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_0_50px_-12px_rgba(249,115,22,0.4)] border-2 border-orange-50">
                        <Loader2 className="h-14 w-14 text-orange-500 animate-spin" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-pink-600 tracking-tight">
                        Processing Payment
                    </h2>

                    <p className="text-slate-600 text-lg sm:text-xl font-medium">
                        Please wait while your transaction is being securely completed.
                    </p>
                </div>

                {/* Warning Card */}
                <div className="p-6 bg-red-50 rounded-2xl border border-red-200 mt-8 w-full shadow-sm">
                    <div className="flex flex-col items-center space-y-3 text-red-800">
                        <div className="flex items-center space-x-2 font-bold text-lg">
                            <AlertTriangle className="h-7 w-7 text-red-600" />
                            <span>IMPORTANT</span>
                        </div>
                        <p className="text-[17px] font-semibold text-red-700 leading-snug">
                            Please do NOT close or refresh this tab.
                        </p>
                    </div>
                </div>

                {/* Progress Bar (Indeterminate) */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-8">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-pink-600 animate-progress-indeterminate rounded-full" />
                </div>
            </div>
        </div>
    );
};
