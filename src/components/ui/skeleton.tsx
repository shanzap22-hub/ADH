import { cn } from "@/lib/utils"

// Premium shimmer skeleton — violet-tinted shimmer wave animation
function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800/80",
                "before:absolute before:inset-0",
                "before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-slate-600/30 before:to-transparent",
                "before:animate-[shimmer_1.8s_ease-in-out_infinite]",
                "before:translate-x-[-200%]",
                className
            )}
            {...props}
        />
    )
}

export { Skeleton }
