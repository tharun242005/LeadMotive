// ============================================================================
// SignalDesk — Lead Intelligence Workspace
// ============================================================================
//
// This is the main entry point. The full workspace UI will be built in
// Prompt 2 (Design System + App Shell). This placeholder ensures the app
// compiles and renders after the Prompt 1 cleanup.
// ============================================================================

export default function WorkspacePage() {
  return (
    <main id="main-content" className="flex-1 flex items-center justify-center">
      <div className="text-center animate-fade-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.58_0.16_70_/_0.1)] text-[oklch(0.50_0.15_68)] text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-[oklch(0.58_0.16_70)] animate-pulse" />
          Foundation Ready
        </div>
        <h1 className="text-4xl font-bold mb-3">
          Signal<span className="text-gradient">Desk</span>
        </h1>
        <p className="text-[var(--foreground-muted)] max-w-md mx-auto mb-2">
          Real Estate Lead Intelligence
        </p>
        <p className="text-sm text-[var(--foreground-subtle)]">
          Workspace UI coming in Prompt 2
        </p>
      </div>
    </main>
  );
}
