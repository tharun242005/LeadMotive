"use client";

import Link from "next/link";
import { LayoutDashboard, UserPlus, RotateCcw, Target, Sparkles, Compass, Bot } from "lucide-react";
import { ThemeToggle } from "./ThemeProvider";
import { LeadMotiveLogo } from "@/components/common/LeadMotiveLogo";

export type WorkspaceView = "leads" | "momentum" | "coach" | "rehearsal";

interface NavRailProps {
  onNewLead: () => void;
  onResetDemo: () => void;
  onViewChange: (view: WorkspaceView) => void;
  onOpenSettings?: () => void;
  activeView?: WorkspaceView;
}

function NavButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <div className="relative flex items-center justify-center w-full my-0.5">
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-brand rounded-r-full shadow-glow" />
      )}
      <button
        onClick={onClick}
        title={label}
        aria-label={label}
        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer
          ${active
            ? "bg-[#242721] text-[#E06345] ring-1 ring-[#B94F34]/40 dark:bg-raised dark:text-brand font-semibold shadow-xs"
            : "text-[#A4A79D] hover:text-white hover:bg-[#1E201B] dark:text-muted dark:hover:text-ink dark:hover:bg-raised/60"
          }`}
      >
        <Icon className="w-5 h-5" />
      </button>
    </div>
  );
}

export function NavRail({
  onNewLead,
  onResetDemo,
  onViewChange,
  onOpenSettings,
  activeView = "leads",
}: NavRailProps) {
  return (
    <nav className="w-16 shrink-0 bg-[#121411] dark:bg-nav border-r border-[#262823] dark:border-edge flex flex-col items-center py-4 gap-1 hidden md:flex transition-colors z-20">
      {/* Brand logo navigates to public homepage */}
      <Link
        href="/"
        className="mb-6 hover:opacity-90 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-brand rounded-xl"
        title="LeadMotive Home"
      >
        <LeadMotiveLogo iconOnly size="md" />
      </Link>

      {/* Primary nav buttons */}
      <NavButton
        icon={LayoutDashboard}
        label="Workspace Leads"
        active={activeView === "leads"}
        onClick={() => onViewChange("leads")}
      />

      <NavButton
        icon={Bot}
        label="AI Sales Coach (Full-Page Studio)"
        active={activeView === "coach"}
        onClick={() => onViewChange("coach")}
      />

      <NavButton
        icon={Target}
        label="Objection & Buyer Rehearsal (Full-Page Studio)"
        active={activeView === "rehearsal"}
        onClick={() => onViewChange("rehearsal")}
      />

      <NavButton
        icon={Compass}
        label="Lead Momentum Plan"
        active={activeView === "momentum"}
        onClick={() => onViewChange("momentum")}
      />

      <NavButton icon={UserPlus} label="Add Inbound Lead" onClick={onNewLead} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      {onOpenSettings && (
        <NavButton icon={Sparkles} label="AI Diagnostics & Sandbox" onClick={onOpenSettings} />
      )}
      <NavButton icon={RotateCcw} label="Reset Demo Data" onClick={onResetDemo} />

      <div className="my-2">
        <ThemeToggle compact />
      </div>

      {/* User profile avatar (Tharun P) */}
      <div
        className="w-8 h-8 rounded-full bg-brand/20 border border-brand/50 flex items-center justify-center text-xs font-bold text-brand cursor-default mt-1"
        title="Logged in as Tharun P (Sales Lead)"
      >
        T
      </div>
    </nav>
  );
}

// Mobile bottom bar
export function MobileNav({
  onNewLead,
  onBack,
  showBack,
  onViewChange,
  activeView = "leads",
}: {
  onNewLead: () => void;
  onBack: () => void;
  showBack: boolean;
  onViewChange?: (view: WorkspaceView) => void;
  activeView?: WorkspaceView;
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121411] dark:bg-panel border-t border-[#262823] dark:border-edge px-3 py-2 flex items-center justify-around shadow-lg">
      <button
        onClick={() => (showBack ? onBack() : onViewChange?.("leads"))}
        className={`flex flex-col items-center gap-1 text-xs font-medium ${
          activeView === "leads" ? "text-brand" : "text-[#A4A79D] dark:text-muted"
        }`}
      >
        <LayoutDashboard className="w-4 h-4" />
        <span>Leads</span>
      </button>

      {onViewChange && (
        <button
          onClick={() => onViewChange("coach")}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeView === "coach" ? "text-brand" : "text-[#A4A79D] dark:text-muted"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Coach</span>
        </button>
      )}

      {onViewChange && (
        <button
          onClick={() => onViewChange("rehearsal")}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeView === "rehearsal" ? "text-brand" : "text-[#A4A79D] dark:text-muted"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Practise</span>
        </button>
      )}

      {onViewChange && (
        <button
          onClick={() => onViewChange("momentum")}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${
            activeView === "momentum" ? "text-brand" : "text-[#A4A79D] dark:text-muted"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Plan</span>
        </button>
      )}

      <button
        onClick={onNewLead}
        className="flex flex-col items-center gap-1 text-[#A4A79D] dark:text-muted text-xs font-medium"
      >
        <UserPlus className="w-4 h-4" />
        <span>Add</span>
      </button>
      <ThemeToggle compact />
    </div>
  );
}
