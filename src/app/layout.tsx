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
    default: "IQOL — Intelligent Property Conversations",
    template: "%s | IQOL",
  },
  description:
    "IQOL is a multilingual real-estate lead-conversion demonstration. " +
    "Explore premium Bengaluru properties and engage in AI-powered conversations " +
    "in six languages. All data is synthetic and for demonstration only.",
  keywords: [
    "IQOL",
    "real estate",
    "Bengaluru",
    "property",
    "AI conversation",
    "multilingual",
    "demo",
  ],
  robots: "noindex, nofollow",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
