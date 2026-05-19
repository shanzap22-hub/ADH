import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    // Base — tactile feel, GPU-accelerated, instant tap response
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] touch-manipulation select-none [-webkit-tap-highlight-color:transparent]",
    {
        variants: {
            variant: {
                // The new beautiful global theme gradient for all standard buttons
                default:
                    "bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 text-white hover:opacity-90 shadow-sm shadow-pink-500/20 active:scale-95 transition-all",
                // Danger
                destructive:
                    "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20",
                // Bordered outline
                outline:
                    "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm",
                // Subtle secondary
                secondary:
                    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                // Ghost
                ghost:
                    "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100",
                // Link
                link:
                    "text-indigo-600 dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto",
                // Gradient CTA — same as default now
                gradient:
                    "bg-gradient-to-r from-indigo-900 via-pink-600 to-orange-500 text-white hover:opacity-90 shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/30",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm:      "h-9 px-3 text-xs rounded-lg",
                lg:      "h-11 px-6 text-base rounded-xl",
                xl:      "h-12 px-8 text-base rounded-xl",
                icon:    "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
