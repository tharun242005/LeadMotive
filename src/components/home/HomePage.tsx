"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Target,
  Check,
  Copy,
  MessageSquare,
  Compass,
  CheckCircle2,
  BarChart3,
  Play,
  Quote,
} from "lucide-react";
import { ThemeToggle, useTheme } from "@/components/app-shell/ThemeProvider";
import { LeadMotiveLogo } from "@/components/common/LeadMotiveLogo";
import { SEED_LEADS } from "@/lib/leads/fixtures";
import { formatINR } from "@/lib/utils/format";
import { PRIORITY_BAND_LABELS, PRIORITY_STYLES } from "@/lib/leads/scoring";
import type { Lead } from "@/types/lead";

export function HomePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Exactly 1 Act Now, 1 Follow Up, and 1 Nurture lead for clear model explanation
  const previewLeads: Lead[] = [
    SEED_LEADS.find((l) => l.id === "lead-001") || SEED_LEADS[0], // Priya Sharma: Act Now (89)
    SEED_LEADS.find((l) => l.id === "lead-002") || SEED_LEADS[1], // Arjun Reddy: Follow Up (66)
    SEED_LEADS.find((l) => l.id === "lead-006") || SEED_LEADS[5], // Deepak Gowda: Nurture (20)
  ];
  const [selectedLeadId, setSelectedLeadId] = useState<string>(previewLeads[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeLead: Lead = previewLeads.find((l) => l.id === selectedLeadId) || previewLeads[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 200);
      }
    }
  }, []);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      if (typeof window !== "undefined") {
        window.history.pushState(null, "", `#${id}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col selection:bg-brand/20 selection:text-ink transition-colors duration-200">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-panel/90 backdrop-blur-md border-b border-edge transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <LeadMotiveLogo size="md" />
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted">
            <a href="#features" onClick={scrollToSection("features")} className="hover:text-ink transition-colors">Product</a>
            <a href="#how-it-works" onClick={scrollToSection("how-it-works")} className="hover:text-ink transition-colors">How it works</a>
            <a href="#scoring" onClick={scrollToSection("scoring")} className="hover:text-ink transition-colors">Scoring Model</a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle compact />
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-brand text-brand-fg hover:opacity-90 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span>Open Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* ── HERO SECTION ── */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-edge">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & Pitch */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-raised/70 border border-edge text-xs font-semibold tracking-wider uppercase text-subtle">
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span>AI-POWERED REAL ESTATE LEAD INTELLIGENCE</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-ink leading-[1.08]">
                  Know which buyer <br />
                  <span className="text-brand">to move next.</span> <br />
                  Know what to say.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed font-normal">
                  Turn every property enquiry into a clear next action. Prioritise high-intent buyers, understand their needs with AI, practise conversations, and accelerate your pipeline.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-brand text-brand-fg hover:opacity-90 transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <a
                    href="#scoring"
                    onClick={scrollToSection("scoring")}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl text-base font-semibold bg-panel hover:bg-raised text-ink border border-edge transition-all shadow-xs cursor-pointer"
                  >
                    <Play className="w-4 h-4 text-brand fill-brand" />
                    <span>Watch Preview</span>
                  </a>
                </div>

                {/* Metric pill strip */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-edge/60 max-w-lg">
                  <a
                    href="#scoring"
                    onClick={scrollToSection("scoring")}
                    className="group cursor-pointer block"
                    title="Explore Scoring Model"
                  >
                    <div className="text-2xl font-extrabold text-ink font-mono group-hover:text-brand transition-colors">100%</div>
                    <div className="text-xs text-subtle font-medium mt-0.5 group-hover:text-ink transition-colors underline decoration-edge/80 underline-offset-2">Deterministic Scoring</div>
                  </a>
                  <div>
                    <div className="text-2xl font-extrabold text-brand font-mono">&lt;800ms</div>
                    <div className="text-xs text-subtle font-medium mt-0.5">AI Analysis Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold text-ink font-mono">Bengaluru</div>
                    <div className="text-xs text-subtle font-medium mt-0.5">Micro-Market Context</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Architectural Hero Image with Dynamic Day/Night Treatment */}
              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-edge group">
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={isDark ? "/images/hero_night.jpg" : "/images/hero_day.jpg"}
                      alt="Luxury modern residential development in Bengaluru"
                      fill
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                    {/* Subtle theme-tuned gradient vignette overlay */}
                    <div
                      className={`absolute inset-0 pointer-events-none transition-opacity ${
                        isDark
                          ? "bg-gradient-to-t from-[#071521] via-transparent to-transparent opacity-60"
                          : "bg-gradient-to-t from-[#F6F1E9] via-transparent to-transparent opacity-40"
                      }`}
                    />
                  </div>

                  {/* Floating Hand-written Style Callout Overlay */}
                  <div className="absolute top-4 right-4 bg-panel/90 backdrop-blur-md border border-edge/80 rounded-2xl p-3.5 shadow-lg max-w-[210px] select-none">
                    <p className="text-xs font-serif italic text-ink leading-snug">
                      &ldquo;More conversations. More site visits. More closed deals.&rdquo;
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="w-2 h-2 rounded-full bg-positive" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-subtle">
                        Live Sales Pipeline
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4 CORE CAPABILITIES FEATURE CARDS ── */}
        <section id="features" className="py-16 bg-raised/30 border-b border-edge scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl bg-panel border border-edge shadow-xs hover:border-brand/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-ink mb-2">AI Lead Analysis</h3>
                <p className="text-xs text-muted leading-relaxed font-normal">
                  Extract intent, requirements, objections and next actions in seconds from unformatted raw buyer messages.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl bg-panel border border-edge shadow-xs hover:border-brand/40 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-ink mb-2">Smart Prioritisation</h3>
                <p className="text-xs text-muted leading-relaxed font-normal">
                  Focus on high-intent leads with transparent 4-factor scoring: Act Now (75+), Follow Up (45–74), Nurture (0–44).
                </p>
              </div>

              {/* Card 3 - Objection Rehearsal */}
              <div id="rehearsal" className="p-6 rounded-2xl bg-panel border border-edge shadow-xs hover:border-brand/40 transition-all group scroll-mt-28">
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-ink mb-2">Objection Rehearsal</h3>
                <p className="text-xs text-muted leading-relaxed font-normal">
                  Interactive real-time buyer persona simulation. Practise overcoming pricing hesitations, possession anxieties, and school commute objections with AI coaching feedback.
                </p>
              </div>

              {/* Card 4 - Lead Momentum Plan */}
              <div id="momentum" className="p-6 rounded-2xl bg-panel border border-edge shadow-xs hover:border-brand/40 transition-all group scroll-mt-28">
                <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-4 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-ink mb-2">Lead Momentum Plan</h3>
                <p className="text-xs text-muted leading-relaxed font-normal">
                  Actionable multi-step closing roadmap. Converts buyer criteria into milestone-driven follow-ups with adaptive branching, WhatsApp scripts, and progress tracking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECONDARY SHOWCASE: From enquiry to informed action ── */}
        <section id="how-it-works" className="py-20 lg:py-28 border-b border-edge scroll-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Editorial Story */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block px-3 py-1 rounded-full bg-raised text-xs font-semibold uppercase tracking-wider text-subtle border border-edge">
                  BUILT FOR REAL ESTATE SALES TEAMS
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink tracking-tight leading-tight">
                  From enquiry <br />
                  to informed action.
                </h2>

                <p className="text-base text-muted leading-relaxed">
                  LeadMotive combines deterministic scoring with advanced AI to help you understand every buyer, prioritise your time, and have better first conversations.
                </p>

                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-positive shrink-0 mt-0.5" />
                    <p className="text-sm text-ink font-medium leading-relaxed">
                      Zero guessing on customer urgency with rule-based mathematical qualification.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-positive shrink-0 mt-0.5" />
                    <p className="text-sm text-ink font-medium leading-relaxed">
                      Instant WhatsApp response drafts tailored to Whitefield, Sarjapur, and Hebbal projects.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-positive shrink-0 mt-0.5" />
                    <p className="text-sm text-ink font-medium leading-relaxed">
                      Safe from prompt injection attacks: customer inquiry text is strictly untrusted input.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/workspace"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <span>Launch Sales Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Interior Architectural Image with Floating Quote */}
              <div className="lg:col-span-6 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-edge group">
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src="/images/showcase_interior.jpg"
                      alt="Modern luxury Bengaluru residence interior"
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>

                  {/* Floating Testimonial Quote Card */}
                  <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-panel/95 backdrop-blur-md border border-edge shadow-xl">
                    <Quote className="w-6 h-6 text-brand mb-2 opacity-80" />
                    <p className="text-sm font-medium text-ink leading-relaxed">
                      &ldquo;Finally, a way to focus on the right leads and have better first conversations.&rdquo;
                    </p>
                    <p className="text-xs text-subtle mt-2 font-semibold">
                      — Senior Sales Consultant, Bengaluru Luxury Portfolio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE WORKSPACE PREVIEW & SCORING MODEL ── */}
        <section id="scoring" className="py-20 lg:py-24 bg-raised/30 border-b border-edge scroll-mt-20 relative">
          <div id="preview" className="scroll-mt-20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="text-xs font-bold text-brand uppercase tracking-wider mb-2 block">
                Interactive Workspace Demo · Synthetic Showcase Data
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
                Try LeadMotive on Sample Bengaluru Leads
              </h2>
              <p className="text-sm text-muted mt-3">
                Click across the three canonical buyers below to see real-time score factor contributions and AI next actions.
              </p>
            </div>

            {/* Interactive Preview Container */}
            <div className="rounded-3xl border-2 border-edge bg-panel shadow-xl overflow-hidden">
              {/* Lead Selector Tabs */}
              <div className="flex border-b border-edge divide-x divide-edge overflow-x-auto bg-raised/40">
                {previewLeads.map((l) => {
                  const isSelected = l.id === selectedLeadId;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLeadId(l.id)}
                      className={`flex-1 min-w-[200px] p-4 text-left transition-all cursor-pointer
                        ${isSelected ? "bg-panel border-t-2 border-brand" : "hover:bg-raised/60 text-muted"}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-bold truncate ${isSelected ? "text-ink" : "text-muted"}`}>
                          {l.name}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[l.priority.band].badgeCompactClass}`}
                        >
                          {PRIORITY_BAND_LABELS[l.priority.band]} · {l.priority.total}
                        </span>
                      </div>
                      <p className="text-xs text-subtle truncate">
                        {l.location} · {formatINR(l.budget)}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Lead Preview Body */}
              <div className="p-6 lg:p-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left 7 cols: Lead inquiry & recommendation */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="p-4 rounded-xl bg-canvas border border-edge">
                      <span className="text-xs font-bold text-subtle uppercase tracking-wider block mb-2">
                        Customer Message
                      </span>
                      <blockquote className="text-sm text-ink italic leading-relaxed">
                        &ldquo;{activeLead.customerMessage}&rdquo;
                      </blockquote>
                    </div>

                    <div className="p-5 rounded-2xl border-2 border-brand/40 bg-raised/50 shadow-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-brand" />
                        <span className="text-xs font-bold text-brand uppercase tracking-wider">
                          Recommended Action ({activeLead.analysis?.recommendedAction.timeframe})
                        </span>
                      </div>
                      <p className="text-base font-semibold text-ink leading-relaxed">
                        {activeLead.analysis?.recommendedAction.description}
                      </p>
                    </div>

                    {/* WhatsApp Script with Copy */}
                    <div className="p-4 rounded-xl bg-canvas border border-edge">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-subtle uppercase tracking-wider">
                          Personalized Outreach Script
                        </span>
                        <button
                          onClick={() => handleCopy(activeLead.analysis?.suggestedResponse || "", activeLead.id)}
                          className="text-xs font-semibold text-brand hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === activeLead.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === activeLead.id ? "Copied" : "Copy Script"}</span>
                        </button>
                      </div>
                      <p className="text-xs text-muted font-mono leading-relaxed bg-panel p-3 rounded-lg border border-edge/60">
                        {activeLead.analysis?.suggestedResponse}
                      </p>
                    </div>
                  </div>

                  {/* Right 5 cols: Scoring Math Card */}
                  <div className="lg:col-span-5 p-5 rounded-2xl bg-canvas border border-edge space-y-4">
                    <div className="flex items-center justify-between border-b border-edge pb-3">
                      <div>
                        <span className="text-xs text-subtle uppercase font-semibold">Priority Score</span>
                        <div className="text-3xl font-extrabold text-ink font-mono mt-0.5">
                          {activeLead.priority.total} <span className="text-sm text-subtle font-normal">/ 100</span>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold ${PRIORITY_STYLES[activeLead.priority.band].badgeClass}`}
                      >
                        {PRIORITY_BAND_LABELS[activeLead.priority.band]} · {activeLead.priority.total}
                      </div>
                    </div>

                    {/* 4 Factors */}
                    <div className="space-y-3">
                      {activeLead.priority.factors.map((f) => (
                        <div key={f.name}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-medium text-muted">{f.label}</span>
                            <span className="font-mono font-bold text-ink">{f.points}/{f.maxPoints}</span>
                          </div>
                          <div className="h-1.5 bg-panel rounded-full overflow-hidden border border-edge/40">
                            <div
                              className="h-full bg-brand rounded-full transition-all duration-slow"
                              style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-subtle mt-0.5">{f.reason}</p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-edge/60">
                      <Link
                        href={`/workspace?leadId=${activeLead.id}&lead=${activeLead.id}`}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Open this lead in Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA SECTION ── */}
        <section className="py-20 lg:py-24 px-4 sm:px-6 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink mb-4">
            Ready to Accelerate Your Sales Pipeline?
          </h2>
          <p className="text-base text-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Open LeadMotive to review the inbound lead queue, run live Gemini 3.5 Flash Lite analyses, inspect deterministic scoring, and practice objection conversations.
          </p>
          <Link
            href="/workspace"
            className="px-8 py-4 rounded-xl text-base font-bold bg-brand text-brand-fg hover:opacity-90 transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Launch LeadMotive Workspace</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>
      </main>

      {/* ── FOOTER (With Tharun P & run40081@gmail.com Credit) ── */}
      <footer className="py-12 border-t border-edge bg-panel text-xs text-subtle transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-edge/60">
            {/* Logo & Descriptor */}
            <div className="flex flex-col items-center md:items-start gap-1">
              <LeadMotiveLogo size="md" />
              <p className="text-xs text-muted mt-1">
                AI-Powered Real Estate Lead Intelligence
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted">
              <a href="#features" onClick={scrollToSection("features")} className="hover:text-ink transition-colors">Product</a>
              <a href="#how-it-works" onClick={scrollToSection("how-it-works")} className="hover:text-ink transition-colors">How it works</a>
              <a href="#scoring" onClick={scrollToSection("scoring")} className="hover:text-ink transition-colors">Scoring Model</a>
              <Link href="/workspace" className="text-brand font-semibold hover:underline">
                Open Workspace
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            {/* Creator Credit with mailto */}
            <div className="flex items-center gap-2 text-xs text-muted">
              <span>Created by <strong className="text-ink font-semibold">Tharun P</strong></span>
              <span>·</span>
              <a
                href="mailto:run40081@gmail.com"
                className="text-brand hover:underline font-mono font-medium"
              >
                run40081@gmail.com
              </a>
            </div>

            {/* Copyright & Disclaimer */}
            <div className="text-[11px] text-subtle max-w-md">
              <p>
                © 2026 LeadMotive. All buyer records, properties, and message inquiries are fictional synthetic demonstrations.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
