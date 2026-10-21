"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  loadLeads,
  loadPlans,
  savePlan,
  updateStepStatus,
} from "@/lib/storage/local-store";
import type { Lead, LeadMomentumPlan, StepStatus } from "@/types/lead";
import { MomentumWorkspace } from "@/components/momentum/MomentumWorkspace";
import { NavRail } from "@/components/app-shell/NavRail";

function MomentumPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [plans, setPlans] = useState<Record<string, LeadMomentumPlan>>({});
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadedLeads = loadLeads();
    const loadedPlans = loadPlans();
    setLeads(loadedLeads);
    setPlans(loadedPlans);

    const leadParam = searchParams.get("lead");
    if (leadParam && loadedLeads.some((l) => l.id === leadParam)) {
      setSelectedLeadId(leadParam);
    } else if (loadedLeads.length > 0) {
      setSelectedLeadId(loadedLeads[0].id);
    }
    setHydrated(true);
  }, [searchParams]);

  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    router.push(`/workspace/momentum?lead=${id}`);
  };

  const handleSavePlan = (plan: LeadMomentumPlan) => {
    savePlan(plan);
    setPlans((prev) => ({ ...prev, [plan.leadId]: plan }));
  };

  const handleStatusChange = (
    leadId: string,
    stepId: string,
    status: StepStatus,
    blockedReason?: string
  ) => {
    const updated = updateStepStatus(leadId, stepId, status, blockedReason);
    if (updated) {
      setPlans((prev) => ({ ...prev, [leadId]: updated }));
    }
  };

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Navigation Rail */}
      <NavRail
        onNewLead={() => router.push("/workspace")}
        onResetDemo={() => router.push("/workspace")}
      />

      {/* Main Momentum Workspace View */}
      <div className="flex-1 overflow-hidden min-w-0">
        <MomentumWorkspace
          leads={leads}
          selectedLeadId={selectedLeadId}
          onSelectLead={handleSelectLead}
          onBackToLead={() => router.push("/workspace")}
          plans={plans}
          onSavePlan={handleSavePlan}
          onStatusChange={handleStatusChange}
          onOpenCoach={(lead) => router.push(`/workspace?coach=1&lead=${lead.id}`)}
          onOpenRehearsal={(lead) => router.push(`/workspace?rehearsal=1&lead=${lead.id}`)}
        />
      </div>
    </div>
  );
}

export default function MomentumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-canvas">
          <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MomentumPageInner />
    </Suspense>
  );
}
