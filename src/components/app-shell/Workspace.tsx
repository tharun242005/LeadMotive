"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  Lead,
  PriorityBand,
  LeadMomentumPlan,
  StepStatus,
  CopilotMessage,
  ExtractedObjection,
  RehearsalSession,
} from "@/types/lead";
import {
  loadLeads,
  saveLead,
  saveLeads,
  deleteLead,
  resetToSeedData,
  loadPlans,
  savePlan,
  updateStepStatus,
} from "@/lib/storage/local-store";
import { computePriority } from "@/lib/leads/scoring";
import { NavRail, MobileNav } from "@/components/app-shell/NavRail";
import { LeadQueue } from "@/components/leads/LeadQueue";
import { LeadDetail, EmptyWorkspace } from "@/components/analysis/LeadDetail";
import { LeadIntakeForm } from "@/components/leads/LeadIntakeForm";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { RehearsalPanel } from "@/components/rehearsal/RehearsalPanel";
import { AISettingsModal } from "@/components/app-shell/AISettingsModal";
import { MomentumWorkspace } from "@/components/momentum/MomentumWorkspace";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SortOption = "priority" | "newest" | "timeline";
type ActivePanel = "none" | "copilot" | "rehearsal";
type MobileView = "queue" | "detail";
type WorkspaceView = "leads" | "momentum";

const TIMELINE_ORDER: Record<string, number> = {
  immediate: 0,
  "1_to_3_months": 1,
  "3_to_6_months": 2,
  "6_to_12_months": 3,
  beyond_12_months: 4,
  not_specified: 5,
};

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------
export function Workspace() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [plans, setPlans] = useState<Record<string, LeadMomentumPlan>>({});
  const [view, setView] = useState<WorkspaceView>("leads");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<PriorityBand | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [activeRehearsalObjection, setActiveRehearsalObjection] = useState<ExtractedObjection | undefined>(undefined);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("queue");
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loadedLeads = loadLeads();
    const loadedPlans = loadPlans();
    setLeads(loadedLeads);
    setPlans(loadedPlans);
    setHydrated(true);
    // Auto-select the highest-priority lead on desktop
    if (loadedLeads.length > 0 && window.innerWidth >= 768) {
      const sorted = [...loadedLeads].sort((a, b) => b.priority.total - a.priority.total);
      setSelectedLeadId(sorted[0].id);
    }
  }, []);


  // Derived: filtered + sorted leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.propertyRequirement.toLowerCase().includes(q) ||
          l.customerMessage.toLowerCase().includes(q),
      );
    }

    if (priorityFilter !== "all") {
      result = result.filter((l) => l.priority.band === priorityFilter);
    }

    switch (sortBy) {
      case "priority":
        result.sort((a, b) => b.priority.total - a.priority.total);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "timeline":
        result.sort((a, b) => (TIMELINE_ORDER[a.buyingTimeline] ?? 5) - (TIMELINE_ORDER[b.buyingTimeline] ?? 5));
        break;
    }

    return result;
  }, [leads, searchQuery, priorityFilter, sortBy]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === selectedLeadId) ?? null,
    [leads, selectedLeadId],
  );

  // Stats from full dataset (not filtered)
  const stats = useMemo(
    () => ({
      hot: leads.filter((l) => l.priority.band === "hot").length,
      pending: leads.filter((l) => l.analysisStatus === "pending").length,
      total: leads.length,
    }),
    [leads],
  );

  // --- Handlers ---

  const handleSelectLead = useCallback((id: string) => {
    setSelectedLeadId(id);
    setMobileView("detail");
    setActivePanel("none");
    setActiveRehearsalObjection(undefined);
  }, []);

  const handleReanalyze = useCallback(async (id: string, leadDataOverride?: Lead) => {
    // 1. Immediately mark status as analyzing in state & storage
    setLeads((prev) => {
      const updated = prev.map((l) =>
        l.id === id
          ? { ...l, analysisStatus: "analyzing" as const, updatedAt: new Date().toISOString() }
          : l,
      );
      saveLeads(updated);
      return updated;
    });

    try {
      // Find current lead
      const currentLeads = loadLeads();
      const targetLead = leadDataOverride || currentLeads.find((l) => l.id === id);
      if (!targetLead) return;

      const res = await fetch("/api/leads/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: targetLead.name,
          location: targetLead.location,
          propertyRequirement: targetLead.propertyRequirement,
          budget: targetLead.budget,
          buyingTimeline: targetLead.buyingTimeline,
          customerMessage: targetLead.customerMessage,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analyze API returned status ${res.status}`);
      }

      const analysisData = await res.json();

      const updatedPriority = computePriority({
        budget: targetLead.budget,
        buyingTimeline: targetLead.buyingTimeline,
        customerMessage: targetLead.customerMessage,
        location: targetLead.location,
        propertyRequirement: targetLead.propertyRequirement,
      });

      const updatedLead: Lead = {
        ...targetLead,
        analysisStatus: "complete",
        priority: updatedPriority,
        analysis: {
          ...analysisData,
          analyzedAt: new Date().toISOString(),
          model: analysisData.meta?.model || null,
          meta: analysisData.meta,
          isSeeded: false,
        },
        updatedAt: new Date().toISOString(),
      };

      setLeads((prev) => {
        const next = prev.map((l) => (l.id === id ? updatedLead : l));
        saveLeads(next);
        return next;
      });
    } catch (err) {
      console.error("AI analysis failed:", err);
      // Preserve prior valid analysis if it existed
      setLeads((prev) => {
        const next = prev.map((l) => {
          if (l.id !== id) return l;
          return {
            ...l,
            analysisStatus: (l.analysis ? "complete" : "error") as Lead["analysisStatus"],
            updatedAt: new Date().toISOString(),
          };
        });
        saveLeads(next);
        return next;
      });
    }
  }, []);

  const handleAddLead = useCallback(
    (lead: Lead) => {
      const updated = saveLead(lead);
      setLeads(updated);
      setSelectedLeadId(lead.id);
      setIsIntakeOpen(false);
      setMobileView("detail");
      // Auto-trigger AI analysis for the newly added lead
      handleReanalyze(lead.id, lead);
    },
    [handleReanalyze],
  );

  const handleDeleteLead = useCallback(
    (id: string) => {
      const updated = deleteLead(id);
      setLeads(updated);
      if (selectedLeadId === id) {
        setSelectedLeadId(updated.length > 0 ? updated[0].id : null);
        setMobileView("queue");
      }
      setActivePanel("none");
    },
    [selectedLeadId],
  );

  const handleResetDemo = useCallback(() => {
    const reset = resetToSeedData();
    setLeads(reset);
    setPlans(loadPlans());
    const sorted = [...reset].sort((a, b) => b.priority.total - a.priority.total);
    setSelectedLeadId(sorted.length > 0 ? sorted[0].id : null);
    setActivePanel("none");
    setView("leads");
    setSearchQuery("");
    setPriorityFilter("all");
  }, []);

  const handleSavePlan = useCallback((plan: LeadMomentumPlan) => {
    savePlan(plan);
    setPlans((prev) => ({ ...prev, [plan.leadId]: plan }));
  }, []);

  const handleUpdateCopilotMessages = useCallback((leadId: string, msgs: CopilotMessage[]) => {
    setLeads((prev) => {
      const next = prev.map((l) =>
        l.id === leadId
          ? { ...l, copilotMessages: msgs, updatedAt: new Date().toISOString() }
          : l
      );
      saveLeads(next);
      return next;
    });
  }, []);

  const handleStepStatusChange = useCallback(
    (leadId: string, stepId: string, status: StepStatus, blockedReason?: string) => {
      const updated = updateStepStatus(leadId, stepId, status, blockedReason);
      if (updated) {
        setPlans((prev) => ({ ...prev, [leadId]: updated }));
      }
    },
    []
  );

  const handleOpenRehearsal = useCallback((targetObjection?: ExtractedObjection) => {
    setActiveRehearsalObjection(targetObjection);
    setActivePanel("rehearsal");
  }, []);

  const handleUpdateRehearsalSession = useCallback((leadId: string, session: RehearsalSession) => {
    setLeads((prev) => {
      const next = prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              rehearsalMessages: session.messages,
              rehearsalSession: session,
              updatedAt: new Date().toISOString(),
            }
          : l
      );
      saveLeads(next);
      return next;
    });
  }, []);

  // --- Render ---

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Momentum Workspace View
  if (view === "momentum") {
    return (
      <div className="flex h-screen bg-canvas overflow-hidden">
        <NavRail
          activeView={view}
          onMomentumPlan={() => setView((v) => (v === "momentum" ? "leads" : "momentum"))}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onResetDemo={handleResetDemo}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onRehearsal={
            selectedLead
              ? () => { setActivePanel("rehearsal"); setView("leads"); }
              : undefined
          }
        />
        <div className="flex-1 overflow-hidden min-w-0">
          <MomentumWorkspace
            leads={filteredLeads.length > 0 ? filteredLeads : leads}
            selectedLeadId={selectedLeadId || (leads[0]?.id ?? "")}
            onSelectLead={(id) => setSelectedLeadId(id)}
            onBackToLead={() => setView("leads")}
            plans={plans}
            onSavePlan={handleSavePlan}
            onStatusChange={handleStepStatusChange}
            onOpenCoach={(lead) => {
              setSelectedLeadId(lead.id);
              setActivePanel("copilot");
              setView("leads");
            }}
            onOpenRehearsal={(lead) => {
              setSelectedLeadId(lead.id);
              setActivePanel("rehearsal");
              setView("leads");
            }}
          />
        </div>
        {isSettingsOpen && (
          <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )}
        <MobileNav
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onBack={() => setView("leads")}
          showBack={true}
          onMomentumPlan={() => setView((v) => (v === "momentum" ? "leads" : "momentum"))}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Desktop Nav Rail */}
      <NavRail
        activeView={view}
        onMomentumPlan={() => setView("momentum")}
        onNewLead={() => setIsIntakeOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRehearsal={
          selectedLead
            ? () => setActivePanel((p) => (p === "rehearsal" ? "none" : "rehearsal"))
            : undefined
        }
      />

      {/* Lead Queue */}
      <div
        className={`w-full md:w-80 lg:w-[340px] shrink-0 border-r border-edge bg-panel flex flex-col
          ${mobileView === "detail" ? "hidden md:flex" : "flex"}`}
      >
        <LeadQueue
          leads={filteredLeads}
          selectedLeadId={selectedLeadId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onFilterChange={setPriorityFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onSelectLead={handleSelectLead}
          onNewLead={() => setIsIntakeOpen(true)}
          stats={stats}
        />
      </div>

      {/* Main workspace + optional side panel */}
      <div
        className={`flex-1 flex overflow-hidden min-w-0
          ${mobileView === "queue" ? "hidden md:flex" : "flex"}`}
      >
        {/* Lead detail */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {selectedLead ? (
            <LeadDetail
              key={selectedLead.id}
              lead={selectedLead}
              existingPlan={plans[selectedLead.id] || null}
              onOpenMomentumPlan={() => setView("momentum")}
              onReanalyze={handleReanalyze}
              onDelete={handleDeleteLead}
              onOpenCopilot={() => setActivePanel((p) => (p === "copilot" ? "none" : "copilot"))}
              onOpenRehearsal={handleOpenRehearsal}
              onBack={() => { setMobileView("queue"); setActivePanel("none"); }}
              isCopilotActive={activePanel === "copilot"}
              isRehearsalActive={activePanel === "rehearsal"}
            />
          ) : (
            <EmptyWorkspace stats={stats} onNewLead={() => setIsIntakeOpen(true)} />
          )}
        </div>


        {/* Desktop side panel */}
        {activePanel === "copilot" && selectedLead && (
          <div className="w-[380px] xl:w-[420px] shrink-0 border-l border-edge bg-panel hidden lg:block anim-slide-r">
            <CopilotPanel
              key={`copilot-${selectedLead.id}`}
              lead={selectedLead}
              onUpdateMessages={(msgs) => handleUpdateCopilotMessages(selectedLead.id, msgs)}
              onClose={() => setActivePanel("none")}
            />
          </div>
        )}
        {activePanel === "rehearsal" && selectedLead && (
          <div className="w-[400px] xl:w-[460px] 2xl:w-[500px] shrink-0 border-l border-edge bg-panel hidden lg:block anim-slide-r">
            <RehearsalPanel
              key={`rehearsal-${selectedLead.id}-${activeRehearsalObjection?.label || "default"}`}
              lead={selectedLead}
              initialObjection={activeRehearsalObjection}
              onClose={() => setActivePanel("none")}
              onUpdateSession={(session) => handleUpdateRehearsalSession(selectedLead.id, session)}
            />
          </div>
        )}
      </div>

      {/* Mobile overlay for panels */}
      {activePanel !== "none" && selectedLead && (
        <div className="fixed inset-0 z-50 bg-canvas flex flex-col lg:hidden anim-fade-in">
          {activePanel === "copilot" && (
            <CopilotPanel
              key={`copilot-m-${selectedLead.id}`}
              lead={selectedLead}
              onUpdateMessages={(msgs) => handleUpdateCopilotMessages(selectedLead.id, msgs)}
              onClose={() => setActivePanel("none")}
            />
          )}
          {activePanel === "rehearsal" && (
            <RehearsalPanel
              key={`rehearsal-m-${selectedLead.id}-${activeRehearsalObjection?.label || "default"}`}
              lead={selectedLead}
              initialObjection={activeRehearsalObjection}
              onClose={() => setActivePanel("none")}
              onUpdateSession={(session) => handleUpdateRehearsalSession(selectedLead.id, session)}
            />
          )}
        </div>
      )}

      {/* Lead intake form */}
      {isIntakeOpen && (
        <LeadIntakeForm
          onSubmit={handleAddLead}
          onClose={() => setIsIntakeOpen(false)}
        />
      )}

      {/* AI Settings modal */}
      <AISettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Mobile nav */}
      <MobileNav
        onNewLead={() => setIsIntakeOpen(true)}
        onBack={() => { setMobileView("queue"); setActivePanel("none"); }}
        showBack={mobileView === "detail"}
      />
    </div>
  );
}
