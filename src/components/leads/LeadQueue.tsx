"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  Plus,
  Flame,
} from "lucide-react";
import type { Lead, PriorityBand } from "@/types/lead";
import { formatINR, formatTimeline, formatRelativeDate } from "@/lib/utils/format";
import { PRIORITY_BAND_LABELS, PRIORITY_STYLES } from "@/lib/leads/scoring";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortOption = "priority" | "newest" | "timeline";

interface LeadQueueProps {
  leads: Lead[];
  selectedLeadId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  priorityFilter: PriorityBand | "all";
  onFilterChange: (f: PriorityBand | "all") => void;
  sortBy: SortOption;
  onSortChange: (s: SortOption) => void;
  onSelectLead: (id: string) => void;
  onNewLead: () => void;
  stats: { hot: number; warm?: number; cold?: number; pending: number; total: number };
}

const FILTER_OPTIONS: Array<{ value: PriorityBand | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "hot", label: "Act Now" },
  { value: "warm", label: "Follow Up" },
  { value: "cold", label: "Nurture" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "timeline", label: "Timeline" },
];

export function LeadQueue({
  leads,
  selectedLeadId,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onFilterChange,
  sortBy,
  onSortChange,
  onSelectLead,
  onNewLead,
  stats,
}: LeadQueueProps) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-panel select-text border-r border-edge">
      {/* ── Top Header Toolbar ── */}
      <div className="p-4 pb-3 border-b border-edge">
        {/* Row 1: Header Title, Total Count & Add Lead Action */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-ink tracking-tight">Leads</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-raised text-muted border border-edge/60">
              {stats.total}
            </span>
          </div>

          <button
            onClick={onNewLead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-brand-fg font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 whitespace-nowrap"
            title="Add Lead"
            aria-label="Add new lead"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Lead</span>
          </button>
        </div>

        {/* Row 2: Category Summary Badges (Never wrap internally, sleek pills) */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar py-0.5">
          {stats.hot > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(priorityFilter === "hot" ? "all" : "hot")}
              title={`${stats.hot} Act Now leads (click to filter)`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all hover:opacity-90 active:scale-95 ${
                PRIORITY_STYLES.hot.badgeCompactClass
              } ${priorityFilter === "hot" ? "ring-2 ring-hot/30" : ""}`}
            >
              <Flame className="w-3 h-3 shrink-0" />
              <span>{stats.hot} Act Now</span>
            </button>
          )}
          {(stats.warm ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(priorityFilter === "warm" ? "all" : "warm")}
              title={`${stats.warm} Follow Up leads (click to filter)`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all hover:opacity-90 active:scale-95 ${
                PRIORITY_STYLES.warm.badgeCompactClass
              } ${priorityFilter === "warm" ? "ring-2 ring-warm/30" : ""}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-warm shrink-0" />
              <span>{stats.warm} Follow Up</span>
            </button>
          )}
          {(stats.cold ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => onFilterChange(priorityFilter === "cold" ? "all" : "cold")}
              title={`${stats.cold} Nurture leads (click to filter)`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-all hover:opacity-90 active:scale-95 ${
                PRIORITY_STYLES.cold.badgeCompactClass
              } ${priorityFilter === "cold" ? "ring-2 ring-cold/30" : ""}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cold shrink-0" />
              <span>{stats.cold} Nurture</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-2.5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads by name, locality, specs…"
            className="w-full pl-9 pr-3 py-2 text-xs bg-canvas border border-edge rounded-lg
              placeholder:text-subtle text-ink font-medium
              focus:outline-hidden focus:border-brand focus:ring-1 focus:ring-brand/30
              transition-colors"
          />
        </div>

        {/* Priority Filter Chips & Sort Dropdown */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap">
            {FILTER_OPTIONS.map((opt) => {
              const active = priorityFilter === opt.value;
              const isCategory = opt.value !== "all";
              const catStyle = isCategory ? PRIORITY_STYLES[opt.value as PriorityBand] : null;
              return (
                <button
                  key={opt.value}
                  onClick={() => onFilterChange(opt.value)}
                  className={`inline-flex items-center gap-1 px-1.5 py-1 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer border
                    ${active
                      ? isCategory
                        ? `${catStyle?.badgeCompactClass} shadow-xs`
                        : "bg-brand text-brand-fg border-brand shadow-xs"
                      : "bg-raised/50 hover:bg-raised text-muted hover:text-ink border-edge/60"
                    }`}
                >
                  {isCategory && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        active ? "opacity-90" : catStyle?.dotClass
                      }`}
                    />
                  )}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-1.5 py-1 text-[11px] font-medium text-muted hover:text-ink bg-raised/40 hover:bg-raised border border-edge/60 rounded-md transition-colors cursor-pointer"
              aria-label={`Sort by ${sortBy}`}
            >
              <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label}</span>
              <ChevronDown className="w-3 h-3 text-subtle" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-30 bg-panel border border-edge rounded-lg shadow-lg py-1 min-w-[120px] anim-scale">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onSortChange(opt.value);
                        setSortOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer
                        ${sortBy === opt.value
                          ? "text-brand font-semibold bg-raised/60"
                          : "text-muted hover:text-ink hover:bg-raised/40"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lead Rows List ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-edge/40">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-raised/50 border border-edge flex items-center justify-center text-subtle mb-3">
              <Search className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-ink mb-1">
              {searchQuery || priorityFilter !== "all" ? "No matching leads found" : "No leads in pipeline"}
            </p>
            <p className="text-xs text-muted max-w-[220px] mb-4">
              {searchQuery || priorityFilter !== "all"
                ? "Try clearing filters or search terms."
                : "Add an inbound property inquiry to run AI scoring."}
            </p>
            <button
              onClick={onNewLead}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity cursor-pointer"
            >
              + Add Lead
            </button>
          </div>
        ) : (
          <ul role="listbox" aria-label="Lead queue">
            {leads.map((lead) => {
              const isSelected = lead.id === selectedLeadId;
              const initials = lead.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const band = lead.priority.band;
              const score = lead.priority.total;

              return (
                <li key={lead.id} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => onSelectLead(lead.id)}
                    className={`w-full text-left p-3.5 transition-all relative cursor-pointer group flex items-start gap-3
                      ${isSelected
                        ? "bg-raised/70 border-l-4 border-brand shadow-xs"
                        : "hover:bg-raised/30 border-l-4 border-transparent"
                      }`}
                  >
                    {/* Initials Avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-transform group-hover:scale-105 border
                        ${isSelected
                          ? "bg-brand/15 border-brand/40 text-brand"
                          : "bg-canvas border-edge text-muted"
                        }`}
                    >
                      {initials}
                    </div>

                    {/* Middle Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-sm font-bold truncate ${isSelected ? "text-ink" : "text-ink/90 group-hover:text-ink"}`}>
                          {lead.name}
                        </span>
                        {/* Score Pill Badge */}
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${PRIORITY_STYLES[band].badgeCompactClass}`}
                          title={`${PRIORITY_BAND_LABELS[band]} (${score}/100)`}
                        >
                          <span>{PRIORITY_BAND_LABELS[band]}</span>
                          <span className="opacity-50">·</span>
                          <span>{score}</span>
                        </div>
                      </div>

                      {/* Locality & Requirement */}
                      <p className="text-xs text-muted truncate">
                        {lead.location} · {lead.propertyRequirement}
                      </p>

                      {/* Budget & Timeline & Relative Time */}
                      <div className="flex items-center justify-between gap-2 mt-1 text-[11px] text-subtle font-medium">
                        <span className="truncate">
                          {formatINR(lead.budget)} · {formatTimeline(lead.buyingTimeline)}
                        </span>
                        <span className="shrink-0 font-mono text-[10px]">
                          {formatRelativeDate(lead.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
