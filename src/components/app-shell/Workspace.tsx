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
import { computePriority, formatPriorityDisplay } from "@/lib/leads/scoring";
import { ArrowLeft, Bot, Target } from "lucide-react";
import { NavRail, MobileNav, type WorkspaceView } from "@/components/app-shell/NavRail";
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

  // Load from localStorage on mount & handle browser refresh / URL parameters
  useEffect(() => {
    const rawLeads = loadLeads();
    const loadedPlans = loadPlans();

    // Sanitize leads on fresh load / browser reload:
    // - Clear transient AI Coach conversation state & in-progress practice sessions
    // - Reset any stale analyzing status to complete/idle
    // - Keep all persistent business data (leads, scoring, analyses, momentum plans) intact
    const sanitizedLeads = rawLeads.map((l) => ({
      ...l,
      copilotMessages: [],
      rehearsalMessages: [],
      rehearsalSession: undefined,
      analysisStatus:
        l.analysisStatus === "analyzing"
          ? ((l.analysis ? "complete" : "idle") as Lead["analysisStatus"])
          : l.analysisStatus,
    }));

    setLeads(sanitizedLeads);
    setPlans(loadedPlans);
    setHydrated(true);

    // Reset navigation to default workspace view and close all overlays on reload
    setView("leads");
    setActivePanel("none");
    setIsIntakeOpen(false);
    setIsSettingsOpen(false);

    let initialLeadId: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const leadParam = params.get("lead") || params.get("leadId");

      if (leadParam && sanitizedLeads.some((l) => l.id === leadParam)) {
        initialLeadId = leadParam;
        setMobileView("detail");
      }
    }

    if (!initialLeadId && sanitizedLeads.length > 0 && window.innerWidth >= 768) {
      const sorted = [...sanitizedLeads].sort((a, b) => b.priority.total - a.priority.total);
      initialLeadId = sorted[0].id;
    }

    if (initialLeadId) {
      setSelectedLeadId(initialLeadId);
    }
  }, []);

  // Sync selected lead with URL query params if user navigates with ?lead= or ?leadId=
  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const targetLeadId = params.get("lead") || params.get("leadId");
    if (targetLeadId && leads.some((l) => l.id === targetLeadId)) {
      setSelectedLeadId(targetLeadId);
      setMobileView("detail");
    }
  }, [hydrated, leads]);


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
      warm: leads.filter((l) => l.priority.band === "warm").length,
      cold: leads.filter((l) => l.priority.band === "cold").length,
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

  // Full-Page AI Sales Coach View
  if (view === "coach") {
    const currentLead = selectedLead || leads[0] || null;
    return (
      <div className="flex h-screen bg-canvas overflow-hidden">
        <NavRail
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onResetDemo={handleResetDemo}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar with Lead Context & Selector */}
          <div className="h-14 px-4 sm:px-6 border-b border-edge bg-panel/80 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setView("leads")}
                className="h-8 px-2.5 rounded-lg border border-edge bg-raised/50 hover:bg-raised text-xs font-medium text-ink flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Leads Queue</span>
              </button>
              <div className="h-4 w-px bg-edge shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-sm font-bold text-ink truncate">
                    AI Sales Coach Studio
                  </h1>
                  <p className="text-[10px] text-muted truncate hidden sm:block">
                    Real-time consultative intelligence & strategic conversation drafting
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Switcher Dropdown */}
            {leads.length > 0 && currentLead && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted hidden md:inline">Assisting:</span>
                <select
                  value={currentLead.id}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  aria-label="Select lead for AI Coach"
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-edge bg-raised text-ink cursor-pointer hover:border-brand/50 transition-colors focus:outline-hidden focus:ring-1 focus:ring-brand max-w-[180px] sm:max-w-[240px] truncate"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {formatPriorityDisplay(l.priority.band, l.priority.total)} ({l.location})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Full-Page Studio Content Container */}
          <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col items-center">
            {currentLead ? (
              <div className="w-full max-w-4xl h-full flex flex-col bg-panel rounded-2xl border border-edge shadow-md overflow-hidden">
                <CopilotPanel
                  key={`full-copilot-${currentLead.id}`}
                  lead={currentLead}
                  isFullPage
                  onUpdateMessages={(msgs) => handleUpdateCopilotMessages(currentLead.id, msgs)}
                />
              </div>
            ) : (
              <div className="m-auto text-center p-8 bg-panel rounded-2xl border border-edge">
                <Bot className="w-10 h-10 text-muted mx-auto mb-2" />
                <h2 className="text-sm font-semibold text-ink">No lead selected</h2>
                <p className="text-xs text-muted mt-1">Please select a lead to begin coaching.</p>
              </div>
            )}
          </div>
        </main>

        {isSettingsOpen && (
          <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )}
        <MobileNav
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onBack={() => setView("leads")}
          showBack={true}
        />
      </div>
    );
  }

  // Full-Page Objection & Buyer Rehearsal View
  if (view === "rehearsal") {
    const currentLead = selectedLead || leads[0] || null;
    return (
      <div className="flex h-screen bg-canvas overflow-hidden">
        <NavRail
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onResetDemo={handleResetDemo}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Top Bar with Lead Context & Selector */}
          <div className="h-14 px-4 sm:px-6 border-b border-edge bg-panel/80 backdrop-blur-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setView("leads")}
                className="h-8 px-2.5 rounded-lg border border-edge bg-raised/50 hover:bg-raised text-xs font-medium text-ink flex items-center gap-1.5 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Leads Queue</span>
              </button>
              <div className="h-4 w-px bg-edge shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-sm font-bold text-ink truncate">
                    Objection & Buyer Rehearsal Studio
                  </h1>
                  <p className="text-[10px] text-muted truncate hidden sm:block">
                    Interactive roleplay with simulated buyer personas & coaching rubric debriefs
                  </p>
                </div>
              </div>
            </div>

            {/* Lead Switcher Dropdown */}
            {leads.length > 0 && currentLead && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-muted hidden md:inline">Simulating:</span>
                <select
                  value={currentLead.id}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  aria-label="Select lead for Rehearsal"
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-edge bg-raised text-ink cursor-pointer hover:border-brand/50 transition-colors focus:outline-hidden focus:ring-1 focus:ring-brand max-w-[180px] sm:max-w-[240px] truncate"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {formatPriorityDisplay(l.priority.band, l.priority.total)} ({l.location})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Full-Page Studio Content Container */}
          <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col items-center">
            {currentLead ? (
              <div className="w-full max-w-4xl h-full flex flex-col bg-panel rounded-2xl border border-edge shadow-md overflow-hidden">
                <RehearsalPanel
                  key={`full-rehearsal-${currentLead.id}-${activeRehearsalObjection?.label || "default"}`}
                  lead={currentLead}
                  initialObjection={activeRehearsalObjection}
                  isFullPage
                  onUpdateSession={(session) => handleUpdateRehearsalSession(currentLead.id, session)}
                />
              </div>
            ) : (
              <div className="m-auto text-center p-8 bg-panel rounded-2xl border border-edge">
                <Target className="w-10 h-10 text-muted mx-auto mb-2" />
                <h2 className="text-sm font-semibold text-ink">No lead selected</h2>
                <p className="text-xs text-muted mt-1">Please select a lead to begin rehearsal.</p>
              </div>
            )}
          </div>
        </main>

        {isSettingsOpen && (
          <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )}
        <MobileNav
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onBack={() => setView("leads")}
          showBack={true}
        />
      </div>
    );
  }

  // Momentum Workspace View
  if (view === "momentum") {
    return (
      <div className="flex h-screen bg-canvas overflow-hidden">
        <NavRail
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onResetDemo={handleResetDemo}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
        <div className="flex-1 overflow-hidden min-w-0">
          <MomentumWorkspace
            leads={leads}
            selectedLeadId={selectedLeadId || (leads[0]?.id ?? "")}
            onSelectLead={(id) => setSelectedLeadId(id)}
            onBackToLead={() => setView("leads")}
            plans={plans}
            onSavePlan={handleSavePlan}
            onStatusChange={handleStepStatusChange}
            onOpenCoach={(lead) => {
              setSelectedLeadId(lead.id);
              setView("coach");
            }}
            onOpenRehearsal={(lead) => {
              setSelectedLeadId(lead.id);
              setView("rehearsal");
            }}
          />
        </div>
        {isSettingsOpen && (
          <AISettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        )}
        <MobileNav
          activeView={view}
          onViewChange={(v) => setView(v)}
          onNewLead={() => { setView("leads"); setIsIntakeOpen(true); }}
          onBack={() => setView("leads")}
          showBack={true}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Desktop Nav Rail */}
      <NavRail
        activeView={view}
        onViewChange={(v) => setView(v)}
        onNewLead={() => setIsIntakeOpen(true)}
        onResetDemo={handleResetDemo}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Lead Queue */}
      <div
        className={`w-full md:w-80 lg:w-84 xl:w-88 shrink-0 border-r border-edge bg-panel flex flex-col
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
      <main
        id="main-content"
        tabIndex={-1}
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


        {/* Desktop side panel with animated border sweep and restrained entrance */}
        {activePanel === "copilot" && selectedLead && (
          <div className="w-[360px] xl:w-[410px] shrink-0 border-l-2 border-l-brand/50 dark:border-l-accent/50 border-y-0 border-r-0 bg-panel hidden lg:block anim-drawer-open shadow-lg">
            <CopilotPanel
              key={`copilot-${selectedLead.id}`}
              lead={selectedLead}
              onUpdateMessages={(msgs) => handleUpdateCopilotMessages(selectedLead.id, msgs)}
              onClose={() => setActivePanel("none")}
            />
          </div>
        )}
        {activePanel === "rehearsal" && selectedLead && (
          <div className="w-[380px] xl:w-[440px] 2xl:w-[480px] shrink-0 border-l-2 border-l-brand/50 dark:border-l-accent/50 border-y-0 border-r-0 bg-panel hidden lg:block anim-drawer-open shadow-lg">
            <RehearsalPanel
              key={`rehearsal-${selectedLead.id}-${activeRehearsalObjection?.label || "default"}`}
              lead={selectedLead}
              initialObjection={activeRehearsalObjection}
              onClose={() => setActivePanel("none")}
              onUpdateSession={(session) => handleUpdateRehearsalSession(selectedLead.id, session)}
            />
          </div>
        )}
      </main>

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
        activeView={view}
        onViewChange={(v) => setView(v)}
        onNewLead={() => setIsIntakeOpen(true)}
        onBack={() => { setMobileView("queue"); setActivePanel("none"); }}
        showBack={mobileView === "detail"}
      />
    </div>
  );
}
