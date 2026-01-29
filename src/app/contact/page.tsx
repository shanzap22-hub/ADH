"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTransition } from "react";
import { toast } from "sonner";
import { submitContactForm } from "@/actions/contact";

export default function ContactPage() {
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const result = await submitContactForm(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success("Message sent successfully!");
                // Optional: Reset form here if needed, but standard form submission resets usually.
                // To reset controlled form we need state, but FormData approach clears if we reset the HTMLFormElement.
                const form = document.getElementById("contact-form") as HTMLFormElement;
                form?.reset();
            }
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4">
                        Contact Us
                    </h1>
                    <p className="text-xl text-slate-400">
                        Get in touch with the ADH CONNECT team
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-12 mb-16">
                    {/* Left Side - Contact Details */}
                    <div className="space-y-8">
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">Get In Touch</h2>

                            <div className="space-y-6">
                                {/* Address */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Address</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            CKM COMPLEX, Ground Floor<br />
                                            Manjambra Road, East Chembulangad<br />
                                            Cherukudangad Post, Parudur<br />
                                            679305, Palakkad, Kerala
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                        <Phone className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Phone</h3>
                                        <a href="tel:+917591977888" className="text-slate-400 hover:text-orange-400 transition">
                                            +91 7591977888
                                        </a>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                                        <Mail className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Email</h3>
                                        <a href="mailto:info@adh.today" className="text-slate-400 hover:text-orange-400 transition">
                                            info@adh.today
                                        </a>
                                    </div>
                                </div>

                                {/* Business Hours */}
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <Clock className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-white mb-1">Business Hours</h3>
                                        <p className="text-slate-400 text-sm">
                                            Monday - Saturday: 9:00 AM - 6:00 PM<br />
                                            Sunday: Closed
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Contact Form */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8">
                        <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>

                        <form id="contact-form" action={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name" className="text-white">Full Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Your name"
                                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="email" className="text-white">Email Address *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+91 XXXXX XXXXX"
                                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                                />
                            </div>

                            <div>
                                <Label htmlFor="message" className="text-white">Message *</Label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    placeholder="Tell us how we can help you..."
                                    className="mt-2 bg-slate-900 border-slate-700 text-white"
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold"
                            >
                                {isPending ? "Sending..." : "Send Message"}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Google Maps Removed per request */}
            </div>
        </div>
    );
}

