import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthCodeErrorPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">Authentication Error</h1>
                <p className="text-slate-400 mb-8">
                    Something went wrong while trying to sign you in. This could be due to an expired link or a configuration issue.
                </p>

                <div className="space-y-4">
                    <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-xl text-lg font-semibold transition-all duration-300">
                        <Link href="/login">
                            Try Again
                        </Link>
                    </Button>
                    
                    <Link 
                        href="/" 
                        className="block text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <p className="text-xs text-slate-600">
                        If this persists, please contact support.
                    </p>
                </div>
            </div>
        </div>
    );
}
