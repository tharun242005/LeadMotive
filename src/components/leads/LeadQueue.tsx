"use client";

import { useState } from "react";
import {
  Search,
  ChevronDown,
  MapPin,
  Clock,
  Plus,
  Flame,
  Minus,
  Snowflake,
  AlertCircle,
} from "lucide-react";
import type { Lead, PriorityBand } from "@/types/lead";
import { formatINR, formatTimeline, formatRelativeDate, truncate } from "@/lib/utils/format";

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
  stats: { hot: number; pending: number; total: number };
}

// ---------------------------------------------------------------------------
// Priority band display
// ---------------------------------------------------------------------------

const BAND_CONFIG = {
  hot: { label: "Hot", icon: Flame, class: "bg-hot-fill text-hot" },
  warm: { label: "Warm", icon: Minus, class: "bg-warm-fill text-warm" },
  cold: { label: "Cold", icon: Snowflake, class: "bg-cold-fill text-cold" },
} as const;

const FILTER_OPTIONS: Array<{ value: PriorityBand | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "priority", label: "Priority" },
  { value: "newest", label: "Newest" },
  { value: "timeline", label: "Timeline" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-edge">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-ink">Leads</h2>
            <p className="text-xs text-subtle mt-0.5">
              {stats.hot > 0 && (
                <span className="text-hot">{stats.hot} high-priority</span>
              )}
              {stats.hot > 0 && stats.pending > 0 && <span> · </span>}
              {stats.pending > 0 && (
                <span>{stats.pending} awaiting analysis</span>
              )}
              {stats.hot === 0 && stats.pending === 0 && (
                <span>{stats.total} total</span>
              )}
            </p>
          </div>
          <button
            onClick={onNewLead}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-accent text-accent-fg hover:opacity-90 transition-opacity"
            title="Add lead"
            aria-label="Add new lead"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search leads…"
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-canvas border border-edge rounded-md
              placeholder:text-subtle text-ink
              focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20
              transition-colors duration-fast"
          />
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center gap-2 mt-2.5">
          {/* Priority filter chips */}
          <div className="flex gap-1 flex-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onFilterChange(opt.value)}
                className={`px-2 py-0.5 text-xs font-medium rounded transition-colors duration-fast
                  ${priorityFilter === opt.value
                    ? "bg-brand text-white"
                    : "bg-canvas text-muted hover:text-ink border border-edge"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 px-2 py-0.5 text-xs text-muted hover:text-ink transition-colors"
              aria-label={`Sort by ${sortBy}`}
            >
              <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 bg-panel border border-edge rounded-md shadow-md py-1 min-w-[100px] anim-scale">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                      className={`block w-full text-left px-3 py-1.5 text-xs transition-colors
                        ${sortBy === opt.value ? "text-brand font-medium" : "text-muted hover:text-ink hover:bg-raised"}`}
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

      {/* Lead list */}
      <div className="flex-1 overflow-y-auto">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <Search className="w-8 h-8 text-subtle mb-3" />
            <p className="text-sm font-medium text-muted mb-1">
              {searchQuery || priorityFilter !== "all" ? "No leads match" : "No leads yet"}
            </p>
            <p className="text-xs text-subtle mb-4">
              {searchQuery || priorityFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Add your first lead to get started."}
            </p>
            {!searchQuery && priorityFilter === "all" && (
              <button
                onClick={onNewLead}
                className="text-xs font-medium text-brand hover:underline"
              >
                + Add a lead
              </button>
            )}
          </div>
        ) : (
          <ul role="listbox" aria-label="Lead queue">
            {leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={lead.id === selectedLeadId}
                onSelect={() => onSelectLead(lead.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-divider">
        <p className="text-[10px] text-subtle text-center">
          Synthetic demo data · Browser storage only
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Lead Row
// ---------------------------------------------------------------------------

function LeadRow({
  lead,
  isSelected,
  onSelect,
}: {
  lead: Lead;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const band = BAND_CONFIG[lead.priority.band];
  const BandIcon = band.icon;

  return (
    <li
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      tabIndex={0}
      className={`px-4 py-3 cursor-pointer border-b border-divider transition-colors duration-fast
        ${isSelected
          ? "bg-raised border-l-2 border-l-brand"
          : "hover:bg-canvas border-l-2 border-l-transparent"
        }`}
    >
      {/* Row 1: Name + Score */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-ink truncate mr-2">
          {lead.name}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {lead.analysisStatus === "pending" && (
            <span title="Awaiting analysis"><AlertCircle className="w-3 h-3 text-caution" /></span>
          )}
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${band.class}`}
          >
            <BandIcon className="w-2.5 h-2.5" />
            {lead.priority.total}
          </span>
        </div>
      </div>

      {/* Row 2: Location + Requirement */}
      <div className="flex items-center gap-1 text-xs text-muted mb-0.5">
        <MapPin className="w-3 h-3 shrink-0" />
        <span className="truncate">{lead.location}</span>
        <span className="text-subtle">·</span>
        <span className="truncate">{truncate(lead.propertyRequirement, 30)}</span>
      </div>

      {/* Row 3: Budget + Timeline + Time */}
      <div className="flex items-center gap-2 text-[11px] text-subtle">
        <span>{formatINR(lead.budget)}</span>
        <span>·</span>
        <span className="flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {formatTimeline(lead.buyingTimeline)}
        </span>
        <span className="ml-auto">{formatRelativeDate(lead.createdAt)}</span>
      </div>
    </li>
  );
}
