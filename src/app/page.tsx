import { HomePage } from "@/components/home/HomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeadMotive — Know which buyer to move next. Know what to say.",
  description:
    "LeadMotive helps real estate sales teams prioritize inbound leads with transparent 4-factor scoring, Gemini AI analysis, and live Objection Rehearsal.",
};

export default function RootPage() {
  return <HomePage />;
}
