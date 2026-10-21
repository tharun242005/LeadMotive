import { AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t border-[var(--border-color)] bg-[var(--surface-elevated)]"
      role="contentinfo"
    >
      {/* Synthetic data disclaimer */}
      <div className="demo-banner flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          All property data, builder information and prices on this site are{" "}
          <strong>synthetic/fictional</strong> and for demonstration purposes
          only.
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <span className="font-semibold">IQOL</span>
            <span className="text-[var(--foreground-subtle)]">·</span>
            <span>Intelligent Property Conversations</span>
          </div>

          <div className="text-xs text-[var(--foreground-subtle)] text-center sm:text-right">
            <p>Bengaluru, Karnataka, India</p>
            <p className="mt-1">
              © 2026 IQOL Demo. Not a real estate listing
              service.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
