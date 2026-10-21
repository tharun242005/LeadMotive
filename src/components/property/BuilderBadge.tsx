import { Building, ExternalLink } from "lucide-react";
import type { DemoBuilder } from "@/lib/demo/demo-data";

interface BuilderBadgeProps {
  builder: DemoBuilder;
}

export default function BuilderBadge({ builder }: BuilderBadgeProps) {
  return (
    <section aria-label="Builder information" className="animate-fade-up">
      <h2 className="text-xl font-bold mb-4">Developer</h2>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          {/* Builder logo placeholder */}
          <div className="w-14 h-14 rounded-xl bg-[var(--gradient-brand)] flex items-center justify-center flex-shrink-0">
            <Building className="w-7 h-7 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">{builder.name}</h3>
              <span className="badge badge-neutral text-[0.625rem]">
                DEMO
              </span>
            </div>

            <p className="text-sm text-[oklch(0.50_0.15_68)] font-medium mb-3">
              {builder.tagline}
            </p>

            <p className="text-sm text-[var(--foreground-muted)] leading-relaxed mb-4">
              {builder.description}
            </p>

            <div className="flex flex-wrap gap-4 text-xs text-[var(--foreground-subtle)]">
              <span>Est. {builder.establishedYear}</span>
              <span className="text-[var(--border-color)]">·</span>
              <span>{builder.officeLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
