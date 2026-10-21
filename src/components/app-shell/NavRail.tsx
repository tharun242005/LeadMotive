"use client";

import Link from "next/link";
import { LayoutDashboard, UserPlus, RotateCcw, Target, Sparkles, Compass } from "lucide-react";
import { ThemeToggle } from "./ThemeProvider";

interface NavRailProps {
  onNewLead: () => void;
  onResetDemo: () => void;
  onMomentumPlan?: () => void;
  onRehearsal?: () => void;
  onOpenSettings?: () => void;
  activeView?: "leads" | "momentum";
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
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors duration-fast
        ${active
          ? "bg-raised text-accent font-semibold ring-1 ring-accent/30"
          : "text-muted hover:text-ink hover:bg-raised"
        }`}
    >
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
}

export function NavRail({
  onNewLead,
  onResetDemo,
  onMomentumPlan,
  onRehearsal,
  onOpenSettings,
  activeView = "leads",
}: NavRailProps) {
  return (
    <nav className="w-16 shrink-0 bg-panel border-r border-edge flex flex-col items-center py-4 gap-1 hidden md:flex">
      {/* Brand logo navigates to public homepage */}
      <Link
        href="/"
        className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center mb-6 hover:opacity-90 transition-opacity focus:outline-hidden focus:ring-2 focus:ring-accent"
        title="SignalDesk Home"
      >
        <span className="text-sm font-bold text-white" style={{ color: "var(--sd-accent)" }}>S</span>
      </Link>

      {/* Primary nav */}
      <NavButton
        icon={LayoutDashboard}
        label="Workspace Leads"
        active={activeView === "leads"}
        onClick={() => {
          if (activeView !== "leads" && onMomentumPlan) {
            onMomentumPlan(); // toggle or switch back
          }
        }}
      />

      {onMomentumPlan && (
        <NavButton
          icon={Compass}
          label="Momentum Plan"
          active={activeView === "momentum"}
          onClick={onMomentumPlan}
        />
      )}

      <NavButton icon={UserPlus} label="New Lead" onClick={onNewLead} />

      {onRehearsal && (
        <NavButton icon={Target} label="Objection Rehearsal" onClick={onRehearsal} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom actions */}
      {onOpenSettings && (
        <NavButton icon={Sparkles} label="AI Engine Diagnostics" onClick={onOpenSettings} />
      )}
      <NavButton icon={RotateCcw} label="Reset Demo Data" onClick={onResetDemo} />
      <div className="mt-1">
        <ThemeToggle compact />
      </div>

      {/* Synthetic data indicator */}
      <div className="mt-3 w-2 h-2 rounded-full bg-caution opacity-60" title="Demo: All data is synthetic" />
    </nav>
  );
}

// Mobile bottom bar
export function MobileNav({
  onNewLead,
  onBack,
  showBack,
  onMomentumPlan,
}: {
  onNewLead: () => void;
  onBack: () => void;
  showBack: boolean;
  onMomentumPlan?: () => void;
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-edge px-4 py-2 flex items-center justify-around">
      {showBack ? (
        <button
          onClick={onBack}
          className="flex flex-col items-center gap-0.5 text-muted text-xs"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Leads</span>
        </button>
      ) : (
        <div className="flex flex-col items-center gap-0.5 text-brand text-xs">
          <LayoutDashboard className="w-5 h-5" />
          <span>Leads</span>
        </div>
      )}
      {onMomentumPlan && (
        <button
          onClick={onMomentumPlan}
          className="flex flex-col items-center gap-0.5 text-muted hover:text-ink text-xs"
        >
          <Compass className="w-5 h-5" />
          <span>Momentum</span>
        </button>
      )}
      <button
        onClick={onNewLead}
        className="flex flex-col items-center gap-0.5 text-muted text-xs"
      >
        <UserPlus className="w-5 h-5" />
        <span>Add</span>
      </button>
      <ThemeToggle compact />
    </div>
  );
}

