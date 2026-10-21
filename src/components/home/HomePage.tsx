"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Target,
  ShieldCheck,
  Clock,
  MapPin,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flame,
  Snowflake,
  ExternalLink,
  Bot,
  Zap,
  Compass,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/app-shell/ThemeProvider";
import { SEED_LEADS } from "@/lib/leads/fixtures";
import { SEEDED_MOMENTUM_PLANS } from "@/lib/leads/momentum-fixtures";
import { formatINR, formatTimeline } from "@/lib/utils/format";
import { priorityBandColor } from "@/lib/leads/scoring";
import type { Lead } from "@/types/lead";

export function HomePage() {
  // Use canonical seed leads for interactive preview
  const previewLeads = SEED_LEADS.slice(0, 3); // Priya (Hot), Arjun (Warm), Deepak (Cold)
  const [selectedLeadId, setSelectedLeadId] = useState<string>(previewLeads[0].id);
  const [showMathDetails, setShowMathDetails] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Momentum plan preview state
  const [momentumLeadId, setMomentumLeadId] = useState<string>("lead-001");
  const [expandedStepId, setExpandedStepId] = useState<string | null>("step-p1");

  const activeLead: Lead = previewLeads.find((l) => l.id === selectedLeadId) || previewLeads[0];
  const bandStyle = priorityBandColor(activeLead.priority.band);

  const activeMomentumPlan =
    SEEDED_MOMENTUM_PLANS[momentumLeadId] || SEEDED_MOMENTUM_PLANS["lead-001"];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-accent selection:text-accent-fg">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-panel/85 backdrop-blur-md border-b border-edge transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-accent font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-ink">SignalDesk</span>
              <span className="text-[10px] text-subtle font-mono uppercase tracking-wider">Lead Intelligence</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted">
            <a href="#preview" className="hover:text-ink transition-colors">Interactive Preview</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">How It Works</a>
            <a href="#momentum" className="hover:text-ink transition-colors font-semibold text-accent">Momentum Plan</a>
            <a href="#rehearsal" className="hover:text-ink transition-colors">Objection Rehearsal</a>
            <a href="#scoring" className="hover:text-ink transition-colors">4-Factor Scoring</a>
            <a href="#trust" className="hover:text-ink transition-colors">Trust & Evidence</a>
          </nav>


          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              href="/workspace"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-brand text-accent hover:opacity-95 transition-opacity shadow-xs focus:outline-hidden focus:ring-2 focus:ring-accent"
            >
              <span>Launch workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* ── Hero Section ── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 max-w-5xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-raised border border-edge text-muted mb-6 anim-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Bengaluru Real Estate Sales Intelligence</span>
            <span className="text-subtle">•</span>
            <span className="font-mono text-[11px] text-subtle">0ms Deterministic Math + Gemini 3.8 Flash</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink max-w-3xl mx-auto leading-[1.12] mb-6">
            Know which lead to call. <br className="hidden sm:inline" />
            <span className="text-muted">Know what to say.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed mb-8">
            A high-clarity sales workbench for real-estate teams. Deterministically score buyer urgency in milliseconds, uncover hidden customer objections with AI, and practice your pitch before dialing.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 mb-12">
            <Link
              href="/workspace"
              className="px-6 py-3 rounded-lg text-sm font-semibold bg-brand text-accent hover:opacity-95 transition-all shadow-md flex items-center gap-2 group"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#preview"
              className="px-5 py-3 rounded-lg text-sm font-medium border border-edge bg-panel text-ink hover:bg-raised transition-colors"
            >
              Explore Live Preview ↓
            </a>
          </div>

          {/* Value Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left max-w-4xl mx-auto pt-6 border-t border-edge/80">
            <div className="p-3 rounded-lg bg-panel/50 border border-edge">
              <span className="text-xs font-semibold text-ink block mb-0.5">4-Factor Scoring</span>
              <span className="text-[11px] text-muted leading-snug block">Timeline, intent, requirements, and message engagement depth.</span>
            </div>
            <div className="p-3 rounded-lg bg-panel/50 border border-edge">
              <span className="text-xs font-semibold text-ink block mb-0.5">Objection Rehearsal</span>
              <span className="text-[11px] text-muted leading-snug block">Spar against AI playing the customer with real-time feedback.</span>
            </div>
            <div className="p-3 rounded-lg bg-panel/50 border border-edge">
              <span className="text-xs font-semibold text-ink block mb-0.5">Zero Black Boxes</span>
              <span className="text-[11px] text-muted leading-snug block">Sales reps inspect the mathematical rationale behind every score.</span>
            </div>
            <div className="p-3 rounded-lg bg-panel/50 border border-edge">
              <span className="text-xs font-semibold text-ink block mb-0.5">Offline Resilient</span>
              <span className="text-[11px] text-muted leading-snug block">Runs live Gemini or offline Bengaluru heuristic without breaking.</span>
            </div>
          </div>
        </section>

        {/* ── Interactive Product Preview ── */}
        <section id="preview" className="py-12 bg-raised/30 border-y border-edge">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-8">
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
                Interactive Product Preview
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                See How SignalDesk Qualifies Inbound Buyers
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-2 max-w-xl mx-auto">
                Click between canonical Bengaluru leads to test the live scoring math and qualitative AI synthesis.
              </p>

              {/* Lead Selector Tabs */}
              <div className="inline-flex p-1 rounded-lg bg-panel border border-edge mt-6 shadow-xs max-w-full overflow-x-auto">
                {previewLeads.map((lead) => {
                  const isSelected = lead.id === activeLead.id;
                  const leadBand = lead.priority.band;
                  return (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                        isSelected
                          ? "bg-brand text-accent shadow-xs"
                          : "text-muted hover:text-ink hover:bg-raised"
                      }`}
                    >
                      <span>{lead.name}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                          leadBand === "hot"
                            ? "bg-danger-fill text-danger font-semibold"
                            : leadBand === "warm"
                            ? "bg-warm-fill text-warm"
                            : "bg-raised text-subtle"
                        }`}
                      >
                        {lead.priority.total}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Workbench Card */}
            <div className="bg-panel border border-edge rounded-xl shadow-lg overflow-hidden anim-fade-in">
              {/* Header info bar */}
              <div className="p-5 border-b border-edge bg-canvas/40 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-semibold text-ink">{activeLead.name}</h3>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium border"
                      style={{
                        backgroundColor: bandStyle.bg,
                        color: bandStyle.text,
                        borderColor: bandStyle.border,
                      }}
                    >
                      {bandStyle.label} ({activeLead.priority.total}/100)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-subtle">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted" />
                      {activeLead.location}
                    </span>
                    <span>•</span>
                    <span>{activeLead.propertyRequirement}</span>
                    <span>•</span>
                    <span className="font-mono font-medium text-ink">
                      {activeLead.budget > 0 ? formatINR(activeLead.budget) : "Budget unstated"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted" />
                      {formatTimeline(activeLead.buyingTimeline)}
                    </span>
                  </div>
                </div>

                <Link
                  href="/workspace"
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-raised text-ink hover:bg-edge transition-colors flex items-center gap-1.5"
                >
                  <span>Open in Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5 text-subtle" />
                </Link>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-edge">
                {/* Column 1: Customer Evidence + 4-Factor Score Breakdown */}
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-subtle block mb-1.5">
                      Customer Inbound Message (Evidence)
                    </span>
                    <blockquote className="p-3 rounded-lg bg-raised/40 border border-edge text-xs leading-relaxed text-ink italic font-serif">
                      &ldquo;{activeLead.customerMessage}&rdquo;
                    </blockquote>
                  </div>

                  {/* 4-Factor Progress Bars */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-subtle">
                        Deterministic 4-Factor Rubric
                      </span>
                      <button
                        onClick={() => setShowMathDetails(!showMathDetails)}
                        className="text-[11px] text-accent hover:underline flex items-center gap-0.5"
                      >
                        <span>{showMathDetails ? "Hide audit" : "Inspect math"}</span>
                        {showMathDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {activeLead.priority.factors.map((factor) => {
                        const pct = Math.round((factor.points / factor.maxPoints) * 100);
                        return (
                          <div key={factor.name} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-ink">{factor.label}</span>
                              <span className="font-mono text-muted">
                                {factor.points} <span className="text-subtle">/ {factor.maxPoints} pts</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-raised rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand rounded-full transition-all duration-normal"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {showMathDetails && (
                              <p className="text-[10px] text-subtle italic">{factor.reason}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Column 2: AI Analysis & Action */}
                <div className="p-5 space-y-4">
                  {/* Analysis Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Intent Synthesis
                      </span>
                      <span className="text-[10px] font-mono text-subtle">
                        Confidence: {Math.round((activeLead.analysis?.intentConfidence || 0.85) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      {activeLead.analysis?.summary}
                    </p>
                  </div>

                  {/* Objections */}
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-subtle block mb-1.5">
                      Extracted Customer Objections
                    </span>
                    <div className="space-y-1.5">
                      {activeLead.analysis?.objections.map((obj, i) => (
                        <div
                          key={i}
                          className="px-2.5 py-1.5 rounded-md bg-raised/50 border border-edge flex items-center justify-between text-xs"
                        >
                          <span className="text-ink">{obj.label}</span>
                          <span
                            className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded uppercase ${
                              obj.severity === "high"
                                ? "bg-danger-fill text-danger"
                                : obj.severity === "medium"
                                ? "bg-warm-fill text-warm"
                                : "bg-raised text-subtle"
                            }`}
                          >
                            {obj.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ready-to-Send Suggested Response */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-subtle flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-brand" /> Suggested Response
                      </span>
                      <button
                        onClick={() => handleCopy(activeLead.analysis?.suggestedResponse || "", activeLead.id)}
                        className="text-[11px] text-accent hover:underline flex items-center gap-1"
                      >
                        {copiedId === activeLead.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === activeLead.id ? "Copied" : "Copy WhatsApp"}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-raised/60 border border-edge text-xs leading-relaxed text-ink">
                      {activeLead.analysis?.suggestedResponse}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How It Works (Workflow Section) ── */}
        <section id="how-it-works" className="py-16 md:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
              End-to-End Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              From Inbound Lead to High-Impact Call in Seconds
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2 max-w-xl mx-auto">
              How SignalDesk eliminates sales friction before the first phone ring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-edge bg-panel space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center font-mono font-bold text-xs text-ink">
                01
              </div>
              <h3 className="text-sm font-semibold text-ink">Structured Intake</h3>
              <p className="text-xs text-muted leading-relaxed">
                Capture buyer name, locality, property requirement, budget in Lakhs/Crores, and the raw inquiry message.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-edge bg-panel space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center font-mono font-bold text-xs text-ink">
                02
              </div>
              <h3 className="text-sm font-semibold text-ink">0ms Deterministic Math</h3>
              <p className="text-xs text-muted leading-relaxed">
                Instantly scores timeline (35), intent (30), completeness (20), and depth (15) into Hot, Warm, or Cold bands without LLM lag.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-edge bg-panel space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center font-mono font-bold text-xs text-accent bg-accent-subtle">
                03
              </div>
              <h3 className="text-sm font-semibold text-ink">Qualitative AI Synthesis</h3>
              <p className="text-xs text-muted leading-relaxed">
                Gemini 3.8 Flash extracts underlying anxieties (A-Khata, RERA delay, price/sqft) and drafts tailored Indian-English responses.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-edge bg-panel space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-raised flex items-center justify-center font-mono font-bold text-xs text-ink">
                04
              </div>
              <h3 className="text-sm font-semibold text-ink">Rehearse & Close</h3>
              <p className="text-xs text-muted leading-relaxed">
                Practice objection handling in the interactive simulator before picking up the phone to lock in site visits.
              </p>
            </div>
          </div>
        </section>

        {/* ── Signature Feature: Objection Rehearsal ── */}
        <section id="rehearsal" className="py-16 bg-raised/40 border-y border-edge">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-accent-subtle text-accent border border-accent/20">
                  <Target className="w-3.5 h-3.5" />
                  <span>Required Invented Feature</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink leading-tight">
                  Objection Rehearsal: The Sales Flight Simulator
                </h2>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Most deals are won or lost during the live call when a customer pushes back on pricing, construction delays, or legal approvals.
                </p>
                <p className="text-xs sm:text-sm text-muted leading-relaxed">
                  Instead of dialing cold, sales reps spend 60 seconds roleplaying with the AI playing the customer in-character. The built-in coach simultaneously scores the salesperson&apos;s rebuttal, flags missed opportunities, and suggests high-converting alternatives.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href="/workspace"
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-brand text-accent hover:opacity-95 transition-opacity inline-flex items-center gap-1.5"
                  >
                    <span>Try Rehearsal in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Roleplay UI Mockup */}
              <div className="bg-panel border border-edge rounded-xl shadow-md p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-edge text-xs">
                  <span className="font-semibold text-ink flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-brand" /> Rehearsal Session: Vikram Nair
                  </span>
                  <span className="text-[10px] font-mono text-accent bg-accent-subtle px-2 py-0.5 rounded">
                    Score: 8/10
                  </span>
                </div>

                {/* Chat turns */}
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-raised/50 border border-edge text-ink space-y-1">
                    <span className="text-[10px] font-semibold text-muted block">Salesperson Rebuttal:</span>
                    <p>&ldquo;I understand price is top of mind, Vikram. But when you evaluate our 82% carpet efficiency, you get 140 sqft more usable living area.&rdquo;</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-brand/10 border border-brand/20 text-ink space-y-1">
                    <span className="text-[10px] font-semibold text-brand block">AI Customer (In-Character):</span>
                    <p>&ldquo;Fair point on the layout. But what about the handover timeline? Can you guarantee the 2026 possession with a penalty clause?&rdquo;</p>
                  </div>

                  {/* Coach feedback card */}
                  <div className="p-3 rounded-lg bg-accent-subtle/40 border border-accent/25 space-y-1.5">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Coach Evaluation
                    </span>
                    <p className="text-[11px] text-muted">
                      <strong>Strength:</strong> Reframed headline price into usable carpet efficiency.
                    </p>
                    <p className="text-[11px] text-muted">
                      <strong>Next Move:</strong> Reassure on RERA milestones before offering the site walkthrough.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Signature Capability: Lead Momentum Plan ── */}
        <section id="momentum" className="py-16 md:py-24 bg-canvas border-b border-edge">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-accent-subtle text-accent border border-accent/25 mb-3">
                <Compass className="w-3.5 h-3.5" />
                <span>DYNAMIC EXECUTION STRATEGY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
                Turn every lead into a plan of action.
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-2.5 max-w-2xl mx-auto leading-relaxed">
                Go beyond a summary. Build a personalised sequence of next steps, customer-specific responses, decision checkpoints and alternatives based on what the buyer actually needs.
              </p>

              {/* Sample Lead Selector */}
              <div className="inline-flex p-1.5 rounded-xl bg-panel border border-edge mt-8 shadow-xs max-w-full overflow-x-auto gap-1">
                {[
                  { id: "lead-001", name: "Priya Sharma", role: "Hot Lead • 4 Steps", sub: "Fast-Track Site Visit" },
                  { id: "lead-002", name: "Arjun Reddy", role: "Warm Lead • 6 Steps", sub: "Financing & Loan Pre-Approval" },
                  { id: "lead-006", name: "Deepak Gowda", role: "Cold Lead • 3 Steps", sub: "Discovery & Callback" },
                ].map((item) => {
                  const isSelected = momentumLeadId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMomentumLeadId(item.id);
                        const firstStep = SEEDED_MOMENTUM_PLANS[item.id]?.steps[0]?.id || null;
                        setExpandedStepId(firstStep);
                      }}
                      className={`px-3.5 py-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? "bg-brand text-white shadow-xs"
                          : "text-muted hover:text-ink hover:bg-raised"
                      }`}
                    >
                      <span className="text-xs font-bold block leading-tight">{item.name}</span>
                      <span
                        className={`text-[10px] font-mono block mt-0.5 ${
                          isSelected ? "text-accent font-semibold" : "text-subtle"
                        }`}
                      >
                        {item.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Plan Showcase */}
            <div className="rounded-2xl border border-edge bg-panel shadow-sm overflow-hidden anim-fade-up">
              {/* Plan Header */}
              <div className="p-5 sm:p-6 border-b border-edge bg-raised/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-accent/10 text-accent font-semibold border border-accent/25">
                        Objective: {activeMomentumPlan.objectiveLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-raised text-muted border border-edge">
                        v{activeMomentumPlan.planVersion} • Dynamic Length: {activeMomentumPlan.steps.length} Steps
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-ink">
                      {activeMomentumPlan.planTitle}
                    </h3>
                    <p className="text-xs text-muted mt-1 leading-relaxed max-w-2xl">
                      {activeMomentumPlan.leadSituationSummary}
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <div className="text-xs font-semibold text-ink mb-1 flex items-center sm:justify-end gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-positive" />
                      <span>
                        {activeMomentumPlan.steps.filter((s) => s.status === "completed").length} of{" "}
                        {activeMomentumPlan.steps.length} steps completed
                      </span>
                    </div>
                    <div className="w-48 sm:w-52 h-2 bg-raised rounded-full overflow-hidden border border-edge">
                      <div
                        className="h-full bg-brand transition-all duration-500 rounded-full"
                        style={{
                          width: `${Math.round(
                            (activeMomentumPlan.steps.filter((s) => s.status === "completed").length /
                              activeMomentumPlan.steps.length) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Steps List */}
              <div className="p-5 sm:p-6 space-y-3.5 bg-canvas/40">
                <div className="flex items-center justify-between text-xs text-subtle font-semibold uppercase tracking-wider mb-2">
                  <span>Sequential Actions (Dynamic Length: {activeMomentumPlan.steps.length} Nodes)</span>
                  <span className="text-[11px] font-normal lowercase text-muted">Click step to inspect drafts & branches</span>
                </div>

                <div className="space-y-3">
                  {activeMomentumPlan.steps.map((st) => {
                    const isExpanded = expandedStepId === st.id;
                    const draft = st.communicationDraft;

                    return (
                      <div
                        key={st.id}
                        className={`rounded-xl border transition-all ${
                          isExpanded ? "border-accent/40 bg-panel shadow-xs" : "border-edge bg-panel/70 hover:border-muted/40"
                        }`}
                      >
                        <div
                          onClick={() => setExpandedStepId(isExpanded ? null : st.id)}
                          className="p-3.5 sm:p-4 flex items-start gap-3 cursor-pointer"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold mt-0.5 ${
                              st.status === "completed"
                                ? "bg-emerald-600 text-white"
                                : "bg-raised text-ink"
                            }`}
                          >
                            {st.status === "completed" ? <Check className="w-4 h-4 stroke-[3]" /> : st.sequence}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-0.5">
                              <span className="px-2 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider bg-raised text-muted border border-edge">
                                {st.category.replace(/_/g, " ")}
                              </span>
                              <span className="text-[11px] text-muted font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-subtle" />
                                {st.timing}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                                st.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-raised text-muted"
                              }`}>
                                {st.status}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-semibold text-ink">{st.title}</h4>
                            <p className="text-xs text-muted mt-0.5">{st.purpose}</p>
                          </div>

                          <div className="w-6 h-6 flex items-center justify-center text-muted shrink-0 mt-1">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="px-4 sm:px-5 pb-4 pt-1 border-t border-divider space-y-3.5 text-xs anim-fade-in">
                            <div className="pt-2">
                              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1">
                                Action Instructions
                              </span>
                              <p className="text-ink leading-relaxed">{st.instructions}</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="p-2.5 rounded-lg bg-raised/40 border border-edge">
                                <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-0.5">
                                  Strategic Rationale
                                </span>
                                <p className="text-muted text-[11px]">{st.rationale}</p>
                              </div>

                              <div className="p-2.5 rounded-lg bg-raised/40 border border-edge">
                                <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-0.5">
                                  Customer Evidence
                                </span>
                                <ul className="text-[11px] text-muted space-y-0.5">
                                  {st.supportingEvidence.map((ev, i) => (
                                    <li key={i} className="truncate">• &ldquo;{ev}&rdquo;</li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Communication Draft if present */}
                            {draft && (
                              <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/[0.03]">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5 text-accent" />
                                    <span className="font-semibold text-ink text-xs uppercase tracking-wider">
                                      Personalized {draft.channel} Draft
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(draft.draft, st.id)}
                                    className="px-2.5 py-1 text-xs font-semibold text-brand hover:opacity-80 transition-opacity rounded border border-edge bg-canvas shadow-2xs flex items-center gap-1"
                                  >
                                    {copiedId === st.id ? <Check className="w-3 h-3 text-positive" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedId === st.id ? "Copied" : "Copy draft"}</span>
                                  </button>
                                </div>
                                <div className="p-2.5 bg-canvas rounded-lg border border-divider text-ink leading-relaxed whitespace-pre-wrap text-xs">
                                  {draft.draft}
                                </div>
                              </div>
                            )}

                            {/* Decision Branches */}
                            {st.decisionBranches && st.decisionBranches.length > 0 && (
                              <div>
                                <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider block mb-1.5">
                                  Conditional Decision Branches
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {st.decisionBranches.map((br, bIdx) => (
                                    <div key={bIdx} className="p-2.5 rounded-lg bg-canvas border border-edge text-[11px]">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-semibold text-ink">IF: {br.condition}</span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-raised text-muted border border-edge">
                                          {br.planImpact}
                                        </span>
                                      </div>
                                      <p className="text-muted mt-0.5">Then: {br.recommendedAction}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Bottom CTA to launch workspace */}
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-edge">
                  <span className="text-xs text-muted">
                    Demonstration plan based on canonical Bengaluru buyer data.
                  </span>
                  <Link
                    href={`/workspace/momentum?lead=${momentumLeadId}`}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand text-accent hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                  >
                    <span>Explore Momentum Plan in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── 5 Core System Capabilities Distinction Grid ── */}
            <div className="mt-14 pt-10 border-t border-edge">
              <div className="text-center mb-8">
                <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
                  Architecture Clarity
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-ink">
                  Five Distinct Roles in the SignalDesk Engine
                </h3>
                <p className="text-xs text-muted max-w-xl mx-auto mt-1">
                  Each capability solves a specific step in the salesperson&apos;s workflow without blurring into a generic chat interface.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl border border-edge bg-panel space-y-1.5">
                  <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span>1. AI Lead Analysis</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Unpacks messy inbound messages into verified requirements, customer intent, and hidden objections.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-edge bg-panel space-y-1.5">
                  <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                    <Zap className="w-4 h-4 text-warm" />
                    <span>2. Deterministic 4-Factor Scoring</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    0ms mathematical contract assigning 100 points across Timeline, Intent, Requirements, and Depth with zero LLM lag.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-edge bg-panel space-y-1.5">
                  <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    <span>3. Contextual AI Coach</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    On-demand sales coach answering rep questions grounded strictly in the current lead&apos;s dossier.
                  </p>
                </div>

                <div className="p-4 rounded-xl border-2 border-accent/40 bg-accent/[0.04] space-y-1.5">
                  <div className="flex items-center gap-2 text-ink font-bold text-xs">
                    <Compass className="w-4 h-4 text-accent" />
                    <span>4. Lead Momentum Plan</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Personalized, dynamic-length execution roadmap with drafted scripts, contingency branches, and progress tracking.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-edge bg-panel space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-2 text-ink font-semibold text-xs">
                    <Target className="w-4 h-4 text-danger" />
                    <span>5. Objection Rehearsal</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Flight-simulator roleplay where the AI plays the resistant buyer so sales reps can sharpen their pitch before dialing live.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4-Factor Scoring Breakdown ── */}
        <section id="scoring" className="py-16 md:py-20 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
              Transparent Prioritisation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              The 100-Point Scoring Contract
            </h2>
            <p className="text-xs sm:text-sm text-muted mt-2 max-w-xl mx-auto">
              Auditable, predictable, and explainable to non-technical buyers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl border border-edge bg-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Buying Timeline</span>
                <span className="font-mono text-xs font-bold text-accent">35 pts</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Immediate closes earn maximum points; distant exploratory inquiries are scaled down.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-edge bg-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Explicit Buying Intent</span>
                <span className="font-mono text-xs font-bold text-accent">30 pts</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Stated budget volume paired with explicit transaction, booking, or loan approval signals.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-edge bg-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Requirement Completeness</span>
                <span className="font-mono text-xs font-bold text-accent">20 pts</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Verified Bengaluru micro-market (Whitefield, Sarjapur, etc.) + clear unit typology.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-edge bg-panel space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">Engagement Depth</span>
                <span className="font-mono text-xs font-bold text-accent">15 pts</span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed">
                Communicative substance, investigative questions, and personal/commute context.
              </p>
            </div>
          </div>

          {/* Priority Bands */}
          <div className="p-4 rounded-xl border border-edge bg-raised/30 flex flex-wrap items-center justify-around gap-4 text-center">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-danger" />
              <div className="text-left">
                <span className="text-xs font-semibold text-ink block">Hot Leads (75–100)</span>
                <span className="text-[11px] text-subtle">Call within 15 minutes</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-warm" />
              <div className="text-left">
                <span className="text-xs font-semibold text-ink block">Warm Leads (45–74)</span>
                <span className="text-[11px] text-subtle">Follow up within 2 hours</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-subtle" />
              <div className="text-left">
                <span className="text-xs font-semibold text-ink block">Cold Leads (0–44)</span>
                <span className="text-[11px] text-subtle">Automated nurture drip</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust & Evidence Section ── */}
        <section id="trust" className="py-16 bg-panel border-t border-edge">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="text-[11px] font-mono uppercase tracking-wider text-accent font-semibold block mb-1">
                Transparency & Guardrails
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Distinguishing Customer Evidence from AI Interpretation
              </h2>
              <p className="text-xs sm:text-sm text-muted mt-2 max-w-xl mx-auto">
                Real-estate buyers and sales managers need to know what the customer actually said versus what the model inferred.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-edge bg-canvas/40 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <h3 className="text-sm font-semibold text-ink">Customer Evidence (Ground Truth)</h3>
                </div>
                <ul className="text-xs text-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Exact raw customer message preserved verbatim without alteration.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Stated budget number and declared buying timeline.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Explicitly declared family constraints or school preferences.</span>
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl border border-edge bg-canvas/40 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-semibold text-ink">AI Interpretation (Hypothesis)</h3>
                </div>
                <ul className="text-xs text-muted space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-brand">•</span>
                    <span>Classified buying intent category with calculated confidence score.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand">•</span>
                    <span>Extracted objections tagged with severity levels (high/medium/low).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand">•</span>
                    <span>Recommended response scripts and optimal deal velocity touchpoints.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Final CTA Section ── */}
        <section className="py-20 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
            Ready to Explore the Workspace?
          </h2>
          <p className="text-sm text-muted max-w-lg mx-auto mb-8">
            Open SignalDesk to review the lead queue, run re-analyses, inspect scoring factors, and practice objection handling.
          </p>
          <Link
            href="/workspace"
            className="px-6 py-3 rounded-lg text-sm font-semibold bg-brand text-accent hover:opacity-95 transition-all shadow-md inline-flex items-center gap-2"
          >
            <span>Open Workspace (No Login Required)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-8 border-t border-edge bg-panel text-xs text-subtle">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">SignalDesk</span>
            <span>•</span>
            <span>Bengaluru Real Estate Sales Intelligence</span>
          </div>

          <div className="text-center md:text-right max-w-md">
            <p className="text-[11px] leading-relaxed">
              <strong>Synthetic Data Disclaimer:</strong> All buyer records, properties, and message inquiries are fictional and generated for demonstration and evaluation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
