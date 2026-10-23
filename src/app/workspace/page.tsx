import { Workspace } from "@/components/app-shell/Workspace";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales Workspace | LeadMotive",
  description: "LeadMotive Real Estate Intelligence Workspace — Prioritize and act on inbound leads with AI.",
};

export default function WorkspacePage() {
  return <Workspace />;
}
