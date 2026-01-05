import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeedCardProps {
    title: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export const FeedCard = ({
    title,
    description,
    icon,
    action,
    className,
    children,
}: FeedCardProps) => {
    return (
        <div
            className={cn(
                "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow",
                className
            )}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    {icon && (
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20">
                            {icon}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
};
