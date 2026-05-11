import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RazorpayButtonWrapper } from "@/components/payment/RazorpayButtonWrapper";

// 2026 Performance: ISR with 1-hour cache for landing page
export const revalidate = 3600;

export default async function HomePage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#020617] overflow-hidden selection:bg-fuchsia-500/30">
      
      {/* --- Ambient Background Glows --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-fuchsia-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* --- Premium Navbar --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/50 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 transition-opacity hover:opacity-80 shrink-0">
              <Image src="/logo.png" alt="ADH CONNECT" width={180} height={50} className="h-12 sm:h-14 w-auto object-contain" priority />
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/login" className="flex">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium rounded-full px-4 sm:px-6 text-xs sm:text-sm">
                  Login Member
                </Button>
              </Link>
              <RazorpayButtonWrapper>
                <Button className="group relative overflow-hidden rounded-full bg-white text-slate-950 hover:bg-slate-100 px-6 sm:px-8 py-5 sm:py-6 font-bold shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all hover:scale-105 active:scale-95 text-sm sm:text-base">
                  <span className="relative z-10 flex items-center gap-2">
                    Join the Hub <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </RazorpayButtonWrapper>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 pb-24 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[90vh]">
        <div className="max-w-5xl mx-auto text-center space-y-8 sm:space-y-10 z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="h-4 w-4 text-fuchsia-400" />
            <span className="text-xs sm:text-sm font-medium text-slate-300">Kerala's Premier Digital Leadership Community</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-[5.5rem] font-bold text-white leading-[1.1] tracking-tight">
            Stop Outsourcing.<br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">
              Start Leading.
            </span>
          </h1>

          <p className="text-lg sm:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
            Master <strong className="text-white font-medium">Meta Marketing</strong> & <strong className="text-white font-medium">AI Automation</strong> to scale your business through strategic digital leadership.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-8">
            <RazorpayButtonWrapper>
              <Button size="lg" className="group w-full sm:w-auto relative h-14 sm:h-16 px-8 sm:px-10 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] active:scale-95 overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                <span className="relative flex items-center gap-3">
                  Unlock Premium Access <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                </span>
              </Button>
            </RazorpayButtonWrapper>
            <Link href="/login" className="sm:hidden text-slate-400 hover:text-white font-medium text-sm transition-colors mt-2">
              Already a member? Login
            </Link>
          </div>
        </div>
      </section>

      {/* --- Problem/Solution Section (Glassmorphism) --- */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 sm:mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-both">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              Struggling with Manual Processes?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light">
              Implement AI-optimized workflows and entity-driven content strategies for sustainable business growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative z-10">
            {/* Without Card */}
            <div className="group rounded-[2rem] bg-white/5 border border-white/5 backdrop-blur-xl p-8 sm:p-10 hover:bg-white/[0.07] transition-colors duration-500">
              <div className="h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-8 border border-red-500/20">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-6">Without ADH CONNECT</h3>
              <ul className="space-y-4">
                {["Wasting money on ineffective ads", "Spending hours on manual tasks", "Confused by changing algorithms", "No clear digital strategy", "Dependent on expensive agencies"].map((item, i) => (
                  <li key={i} className="flex items-start text-slate-400">
                    <span className="text-slate-600 mr-3 mt-0.5">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* With Card (Premium Glow) */}
            <div className="group relative rounded-[2rem] bg-gradient-to-br from-violet-600/10 to-fuchsia-600/10 border border-fuchsia-500/20 backdrop-blur-xl p-8 sm:p-10 hover:border-fuchsia-500/40 transition-all duration-500 shadow-[0_0_50px_rgba(168,85,247,0.1)] hover:shadow-[0_0_80px_rgba(168,85,247,0.2)] hover:-translate-y-2">
              <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                <Sparkles className="w-24 h-24 sm:w-32 sm:h-32 text-fuchsia-400" />
              </div>
              <div className="relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <span className="text-2xl">✅</span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-6">With ADH CONNECT</h3>
                <ul className="space-y-4">
                  {[
                    "Run profitable Meta ads yourself", 
                    "Save 10+ hours weekly with AI automation", 
                    "Stay ahead of algorithm changes", 
                    "Build personal brand authority", 
                    "Become a digital leader in your niche"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start text-slate-200">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 mr-3 mt-0.5 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Features Grid --- */}
      <section id="features" className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              A Complete System for Mastery
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-2xl mx-auto">
              Everything you need to dominate your market in one premium hub.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: TrendingUp,
                title: "Meta Marketing Mastery",
                desc: "Learn to create, manage, and optimize Facebook & Instagram ads that actually convert. Stop wasting ad spend on guesswork.",
                points: ["Advanced targeting", "Conversion optimization", "Retargeting campaigns", "Analytics & scaling"],
                color: "from-blue-500 to-cyan-400"
              },
              {
                icon: Zap,
                title: "AI & Business Automation",
                desc: "Leverage artificial intelligence and smart tools to automate repetitive tasks and focus on high-value activities.",
                points: ["Content creation with AI", "Workflow automation", "Time-saving tools", "Data-driven decisions"],
                color: "from-fuchsia-500 to-pink-500"
              },
              {
                icon: Award,
                title: "Digital Leadership",
                desc: "Build authority in your niche through strategic personal branding and thought leadership in the digital space.",
                points: ["Brand positioning", "Content frameworks", "Community building", "Credibility growth"],
                color: "from-orange-500 to-amber-500"
              }
            ].map((feat, i) => (
              <div key={i} className="group relative rounded-[2rem] bg-white/[0.03] border border-white/10 p-8 hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-8 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <feat.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed font-light mb-8 text-sm">
                  {feat.desc}
                </p>
                <ul className="space-y-3">
                  {feat.points.map((pt, j) => (
                    <li key={j} className="flex items-center text-sm text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-3 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-900/10 to-[#020617] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-6xl font-bold text-white mb-8 tracking-tight leading-tight">
            Stop Overthinking.<br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Start Executing.
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 sm:mb-12 font-light">
            Join ADH CONNECT today and transform your business with proven systems.
          </p>

          <RazorpayButtonWrapper>
            <Button size="lg" className="group w-full sm:w-auto relative h-14 sm:h-16 px-8 sm:px-12 rounded-full bg-white text-slate-950 font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all hover:scale-[1.02] active:scale-95">
              <span className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-fuchsia-600" />
                Claim Your Spot Now
              </span>
            </Button>
          </RazorpayButtonWrapper>
          <p className="text-slate-500 text-sm mt-6 font-medium">Instant access to all courses & private community</p>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 py-12 px-4 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <Image src="/logo.png" alt="ADH" width={100} height={30} className="h-8 w-auto mb-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all mx-auto md:mx-0" />
            <p className="text-slate-500 text-sm font-medium">© 2026 ADH Connect by Atcess Digital Hub.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm font-medium text-slate-500">
            {["Privacy Policy", "Terms of Service", "Refund Policy", "Contact Us"].map(link => (
              <Link key={link} href={`/${link.toLowerCase().replace(/ /g, '-')}`} className="hover:text-white transition-colors">
                {link}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* Structured Data for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ADH Connect",
          "url": "https://adh.today",
          "logo": "https://adh.today/logo.png",
          "description": "Kerala's premier digital community for business owners and entrepreneurs to master Social Media Marketing, Meta Ads, and AI Automation to scale their business.",
          "address": { "@type": "PostalAddress", "addressRegion": "Kerala", "addressCountry": "IN" }
      }) }} />
    </div>
  );
}
