import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider, themeInitScript } from "@/components/app-shell/ThemeProvider";
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
    default: "LeadMotive — AI-Powered Real Estate Lead Intelligence",
    template: "%s | LeadMotive",
  },
  description:
    "Know which buyer to move next. Know what to say. LeadMotive empowers real estate sales teams to prioritise high-intent buyers, extract key requirements with AI, and accelerate deal closures.",
  keywords: [
    "LeadMotive",
    "real estate",
    "lead intelligence",
    "Bengaluru",
    "AI sales coach",
    "lead scoring",
    "objection rehearsal",
  ],
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent theme flash — runs before any React paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full">
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-brand-fg focus:rounded-lg focus:shadow-lg focus:outline-2 focus:outline-accent"
        >
          Skip to main content
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
