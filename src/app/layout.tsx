import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SignalDesk — Real Estate Lead Intelligence",
    template: "%s | SignalDesk",
  },
  description:
    "SignalDesk helps real-estate salespeople prioritise inbound leads, " +
    "understand customer intent, and act with AI-powered analysis, " +
    "contextual coaching, and objection rehearsal. " +
    "Built for the Bengaluru property market. All data is synthetic.",
  keywords: [
    "SignalDesk",
    "real estate",
    "lead intelligence",
    "Bengaluru",
    "AI",
    "sales",
    "lead scoring",
  ],
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
