import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Script from "next/script";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL('https://adh.today'),
  title: {
    default: "ADH Connect | Digital Marketing & AI Community for Business Owners",
    template: "%s | ADH Connect"
  },
  description: "Join ADH Connect, Kerala's premier digital community for entrepreneurs. Master Social Media Marketing, Automation, and Personal Branding in Malayalam.",
  keywords: [
    "Digital Marketing Malayalam",
    "Business Growth Kerala",
    "Social Media Marketing Course",
    "Meta Ads Training",
    "AI for Business",
    "Entrepreneurship Community",
    "ADH Connect",
    "ADH Digital Hub",
    "Own Your Marketing"
  ],
  authors: [{ name: "ADH Connect" }],
  creator: "ADH Connect",
  publisher: "ADH Connect",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://adh.today",
    title: "ADH Connect | Scale Your Business with Digital Marketing",
    description: "Learn to do your own marketing. Join Kerala's largest community of business owners mastering Digital Marketing & AI.",
    siteName: "ADH Connect",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "ADH Connect Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADH Connect - Digital Mastery for Entrepreneurs",
    description: "Master Digital Marketing & AI to scale your business. Join the community now.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://adh.today",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  }
};

import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/Footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col", outfit.variable)} suppressHydrationWarning>
        <div className="flex-1">
          {children}
        </div>
        <Toaster />
        {/* Razorpay Script for Payment Integration */}
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
