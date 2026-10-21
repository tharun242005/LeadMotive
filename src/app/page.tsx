import { HomePage } from "@/components/home/HomePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignalDesk — Know Which Lead to Call. Know What to Say.",
  description:
    "SignalDesk helps real-estate sales teams prioritize inbound leads with transparent 4-factor scoring, Gemini 3.8 Flash analysis, and live Objection Rehearsal.",
};

export default function RootPage() {
  return <HomePage />;
}
