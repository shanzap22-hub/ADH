import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Starter",
        price: "$29",
        description: "Perfect for new creators launching their first course.",
        features: ["Unlimited students", "5 courses", "Basic transaction fees", "Email support"],
    },
    {
        name: "Professional",
        price: "$99",
        description: "For established creators scaling their business.",
        features: ["Unlimited students", "Unlimited courses", "0% transaction fees", "Priority support", "Custom domain", "Drip content"],
        popular: true,
    },
    {
        name: "Business",
        price: "$299",
        description: "Advanced features for large teams and organizations.",
        features: ["Everything in Pro", "API access", "SSO integration", "Dedicated account manager", "Advanced reporting"],
    },
];

export function Pricing() {
    return (
        <section id="pricing" className="py-24">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl font-bold tracking-tight mb-4 sm:text-4xl">Simple, Transparent Pricing</h2>
                    <p className="text-lg text-muted-foreground">
                        Choose the perfect plan for your teaching journey. No hidden fees.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <div
                            key={index}
                            className={`relative flex flex-col p-8 bg-card rounded-2xl border ${plan.popular ? 'border-primary shadow-xl scale-105 z-10' : 'border-border shadow-sm'}`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wide py-1 px-3 rounded-full">
                                    Most Popular
                                </div>
                            )}
                            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                            <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>
                            <div className="mb-6">
                                <span className="text-4xl font-bold">{plan.price}</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                            <ul className="space-y-3 mb-8 flex-1">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="h-4 w-4 text-primary shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button variant={plan.popular ? "default" : "outline"} className="w-full">
                                Get Started
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
