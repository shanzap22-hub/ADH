import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, Zap, Users, Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RazorpayButtonWrapper } from "@/components/payment/RazorpayButtonWrapper";

export default async function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Premium Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition">
              <Image
                src="/adh-logo.png"
                alt="ADH CONNECT"
                width={180}
                height={60}
                className="h-14 w-auto"
                priority
              />
            </Link>

            {/* Nav Actions */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="lg" className="text-white border border-slate-700 hover:bg-slate-800 hover:border-slate-600 px-4 py-2 sm:px-6 sm:py-2 text-sm sm:text-base font-medium">
                  Member Login
                </Button>
              </Link>

              <RazorpayButtonWrapper>
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-semibold px-4 py-2 sm:px-8 sm:py-3 text-sm sm:text-base shadow-lg shadow-orange-500/20">
                  Join the Hub Now
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
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

            {/* Pricing Highlight */}
            <div className="inline-block bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/30 rounded-2xl p-8 mt-8">
              <p className="text-slate-300 text-sm uppercase tracking-wider mb-3">Limited-Time Exclusive Offer</p>
              <div className="flex items-center justify-center gap-4">
                <span className="text-3xl text-slate-500 line-through">₹17,000</span>
                <ArrowRight className="text-orange-400 h-8 w-8" />
                <span className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  ₹4,999
                </span>
              </div>
              <p className="text-slate-400 mt-3">Premium Course Bundle - Save 71%</p>
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12">
              <RazorpayButtonWrapper>
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base sm:text-lg px-6 py-4 sm:px-12 sm:py-7 shadow-2xl shadow-orange-500/30">
                  <Sparkles className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                  Unlock Premium Access - ₹4,999
                </Button>
              </RazorpayButtonWrapper>
              <p className="text-sm text-slate-500">Join 500+ Forward-Thinking Entrepreneurs</p>
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

      {/* Irresistible Offer Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-900/20 via-pink-900/20 to-purple-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900/90 border-2 border-orange-500/50 rounded-3xl p-12">
            <div className="text-center mb-12">
              <p className="text-orange-400 font-semibold text-sm uppercase tracking-wider mb-3">🚀 LIMITED-TIME OFFER</p>
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                The Complete ADH CONNECT Bundle
              </h2>
              <p className="text-xl text-slate-300">
                Everything You Need to Master Digital Business
              </p>
            </div>

            {/* Value Breakdown */}
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-slate-800/50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Meta Marketing Course</span>
                  <span className="text-slate-400">₹8,000</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">AI Automation Training</span>
                  <span className="text-slate-400">₹5,000</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">Personal Branding Masterclass</span>
                  <span className="text-slate-400">₹4,000</span>
                </div>
                <div className="border-t border-slate-700 mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-lg">Total Value:</span>
                    <span className="text-2xl font-bold text-slate-400 line-through">₹17,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500/20 to-pink-500/20 border-2 border-orange-500/50 rounded-xl p-6 flex flex-col justify-center items-center">
                <p className="text-white text-sm mb-2">Your Investment Today:</p>
                <p className="text-5xl sm:text-7xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  ₹4,999
                </p>
                <p className="text-green-400 font-semibold text-xl mt-4">
                  Save 71% - ₹12,001 Off!
                </p>
                <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
                  <p className="text-red-300 text-sm font-medium">⏰ Offer Expires Soon</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <RazorpayButtonWrapper>
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base sm:text-xl px-8 py-5 sm:px-16 sm:py-8 shadow-2xl shadow-orange-500/40">
                  <Sparkles className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
                  Claim Your Spot - Pay ₹4,999 Now
                </Button>
              </RazorpayButtonWrapper>
              <p className="text-slate-400 mt-4 text-sm">Instant access to all courses & community</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Users className="h-12 w-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by Forward-Thinking Business Owners
            </h2>
            <p className="text-xl text-slate-300">
              Join hundreds of entrepreneurs transforming their businesses
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Scaled my business revenue by 3x in 6 months using the Meta marketing strategies from ADH CONNECT.",
                author: "Priya Sharma",
                role: "Digital Marketing Agency Owner"
              },
              {
                quote: "Saved 10+ hours every week with the AI automation tools. Game-changing for solopreneurs!",
                author: "Rajesh Kumar",
                role: "E-commerce Entrepreneur"
              },
              {
                quote: "Finally built the personal brand I always wanted. My credibility in the industry has skyrocketed.",
                author: "Anita Desai",
                role: "Business Coach"
              }
            ].map((testimonial, idx) => (
              <Card key={idx} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-6">
                  <p className="text-slate-300 italic mb-4">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.author[0]}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{testimonial.author}</p>
                      <p className="text-slate-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Footer */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Stop Being Overwhelmed.<br />
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Start Being a Digital Leader.
            </span>
          </h2>
          <p className="text-xl text-slate-300 mb-12">
            Join ADH CONNECT today and transform your business with Meta Marketing, AI Automation, and Strategic Digital Leadership.
          </p>

          <RazorpayButtonWrapper>
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold text-base sm:text-xl px-8 py-5 sm:px-16 sm:py-8 shadow-2xl shadow-orange-500/40 mb-4">
              <Sparkles className="mr-3 h-6 w-6 sm:h-7 sm:w-7" />
              Get Instant Access for ₹4,999
            </Button>
          </RazorpayButtonWrapper>
          <p className="text-slate-500 text-sm">Limited-time offer • Instant access • 500+ members</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center text-slate-500 text-sm">
          <p>© 2026 Atcess Digital Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
