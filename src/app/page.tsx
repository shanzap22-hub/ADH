import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap, Users, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RazorpayButtonWrapper } from "@/components/payment/RazorpayButtonWrapper";

// 2026 Performance: ISR with 1-hour cache for landing page
export const revalidate = 3600;

export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition shrink-0">
              <Image
                src="/logo.png"
                alt="ADH CONNECT"
                width={200}
                height={60}
                className="h-20 w-auto object-contain"
                priority
              />
            </Link>

            {/* Nav Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button variant="ghost" size="lg" className="text-white border border-slate-700 hover:bg-slate-800 hover:border-slate-600 px-3 py-2 sm:px-6 sm:py-2 text-xs sm:text-base font-medium">
                  Member Login
                </Button>
              </Link>

              <RazorpayButtonWrapper>
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold px-3 py-2 sm:px-8 sm:py-3 text-xs sm:text-base shadow-lg shadow-orange-500/20">
                  <span className="sm:hidden">Join Now</span>
                  <span className="hidden sm:inline">Join the Hub Now</span>
                  <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </RazorpayButtonWrapper>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8">
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Stop Outsourcing.<br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Start Leading.
              </span>
            </h1>

            {/* Sub-headline */}
            <h2 className="text-xl sm:text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
              Master <span className="text-orange-400 font-semibold">Meta Marketing</span> & <span className="text-pink-400 font-semibold">AI</span> to Scale Your Business Through Digital Leadership
            </h2>

            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              ADH CONNECT is the premier community for entrepreneurs ready to build <span className="text-white font-medium">automation</span>, save time, and achieve big-picture results through strategic digital leadership.
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 w-full">
              <div className="w-full sm:w-auto flex justify-center">
                <RazorpayButtonWrapper>
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base sm:text-lg px-6 py-4 sm:px-12 sm:py-7 shadow-2xl shadow-orange-500/30">
                    <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Unlock Premium Access
                  </Button>
                </RazorpayButtonWrapper>
              </div>
              <p className="text-sm text-slate-500 mt-2 sm:mt-0">Join Forward-Thinking Entrepreneurs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-6">
            Struggling with Complex Algorithms & Manual Processes?
          </h2>
          <p className="text-xl text-slate-300 text-center max-w-3xl mx-auto mb-12">
            ADH CONNECT implements <span className="text-orange-400 font-semibold">AI-Optimized workflows</span> and <span className="text-pink-400 font-semibold">Entity-Driven content strategies</span> for sustainable business growth.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-slate-800/50 border-red-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-red-400 mb-4">❌ Without ADH CONNECT</h3>
                <ul className="space-y-3 text-slate-300">
                  <li>• Wasting money on ineffective ads</li>
                  <li>• Spending hours on manual tasks</li>
                  <li>• Confused by changing algorithms</li>
                  <li>• No clear digital strategy</li>
                  <li>• Dependent on expensive agencies</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border-orange-500/30">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-orange-400 mb-4">✅ With ADH CONNECT</h3>
                <ul className="space-y-3 text-slate-200">
                  <li className="flex items-start"><CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-1 flex-shrink-0" /> Run profitable Meta ads yourself</li>
                  <li className="flex items-start"><CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-1 flex-shrink-0" /> Save 10+ hours weekly with AI automation</li>
                  <li className="flex items-start"><CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-1 flex-shrink-0" /> Stay ahead of algorithm changes</li>
                  <li className="flex items-start"><CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-1 flex-shrink-0" /> Build personal brand authority</li>
                  <li className="flex items-start"><CheckCircle2 className="h-5 w-5 text-green-400 mr-2 mt-1 flex-shrink-0" /> Become a digital leader in your niche</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              What's Inside ADH CONNECT
            </h2>
            <p className="text-xl text-slate-300">
              A Complete System for Digital Business Mastery
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Meta Marketing */}
            <Card className="bg-slate-800/50 border-orange-500/30 hover:border-orange-500/60 transition">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Meta Marketing Mastery</h3>
                <p className="text-slate-300 leading-relaxed">
                  Learn to create, manage, and optimize Facebook & Instagram ads that actually convert. Stop wasting ad spend on guesswork.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-400">
                  <li>• Advanced targeting strategies</li>
                  <li>• Conversion optimization</li>
                  <li>• Retargeting campaigns</li>
                  <li>• Analytics & scaling</li>
                </ul>
              </CardContent>
            </Card>

            {/* AI & Automation */}
            <Card className="bg-slate-800/50 border-pink-500/30 hover:border-pink-500/60 transition">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">AI & Business Automation</h3>
                <p className="text-slate-300 leading-relaxed">
                  Leverage artificial intelligence and smart tools to automate repetitive tasks and focus on high-value activities.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-400">
                  <li>• Content creation with AI</li>
                  <li>• Workflow automation</li>
                  <li>• Time-saving tools & systems</li>
                  <li>• Data-driven decision making</li>
                </ul>
              </CardContent>
            </Card>

            {/* Digital Leadership */}
            <Card className="bg-slate-800/50 border-purple-500/30 hover:border-purple-500/60 transition">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Digital Leadership & Branding</h3>
                <p className="text-slate-300 leading-relaxed">
                  Build authority in your niche through strategic personal branding and thought leadership in the digital space.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-slate-400">
                  <li>• Personal brand positioning</li>
                  <li>• Content strategy framework</li>
                  <li>• Community building tactics</li>
                  <li>• Influence & credibility growth</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Is Overwhelming.<br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Start Being a Digital Leader.
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Join ADH CONNECT today and transform your business with Meta Marketing, AI Automation, and Strategic Digital Leadership.
          </p>

          <div className="flex justify-center w-full">
            <div className="w-full sm:w-auto">
              <RazorpayButtonWrapper>
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base sm:text-xl px-8 py-5 sm:px-16 sm:py-8 shadow-2xl shadow-orange-500/40 mb-4">
                  <Sparkles className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                  Claim Your Spot Now
                </Button>
              </RazorpayButtonWrapper>
            </div>
          </div>
          <p className="text-slate-500 text-sm">Instant access to all courses & community</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-4 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-slate-400 font-medium">© 2026 ADH Connect by Atcess Digital Hub.</p>
            <p className="text-slate-600 text-sm mt-1">Empowering Entrepreneurs through Digital Leadership.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <Link href="/privacy" className="hover:text-orange-400 transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-orange-400 transition">Terms of Service</Link>
            <Link href="/refund" className="hover:text-orange-400 transition">Refund Policy</Link>
            <Link href="/contact" className="hover:text-orange-400 transition">Contact Us</Link>
          </div>
        </div>
      </footer>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "ADH Connect",
            "url": "https://adh.today",
            "logo": "https://adh.today/logo.png",
            "description": "Kerala's premier digital community for business owners and entrepreneurs to master Social Media Marketing, Meta Ads, and AI Automation to scale their business.",
            "address": {
              "@type": "PostalAddress",
              "addressRegion": "Kerala",
              "addressCountry": "IN"
            },
            "sameAs": [
              "https://www.instagram.com/adh.today",
              "https://www.facebook.com/adh.today"
            ],
            "offers": {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Course",
                "name": "Digital Marketing Mastery for Entrepreneurs",
                "description": "Comprehensive training in Social Media Marketing, Automation, and Personal Branding for Business Owners in Malayalam."
              }
            }
          })
        }}
      />
    </div>
  );
}
