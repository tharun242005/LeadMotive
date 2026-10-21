import { MapPin, Train, Building2 } from "lucide-react";
import type { PropertyLocation } from "@/lib/demo/demo-data";

interface PropertyLocationSectionProps {
  location: PropertyLocation;
}

export default function PropertyLocationSection({
  location,
}: PropertyLocationSectionProps) {
  return (
    <section aria-label="Location" className="animate-fade-up">
      <h2 className="text-xl font-bold mb-4">Location</h2>

      <div className="card p-6">
        {/* Location label */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-[oklch(0.58_0.16_70_/_0.1)] flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[oklch(0.50_0.15_68)]" />
          </div>
          <div>
            <p className="font-semibold text-lg">
              {location.locality}, {location.city}
            </p>
            <p className="text-sm text-[var(--foreground-muted)]">
              {location.district}, {location.state}
            </p>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="w-full aspect-[16/7] rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-color)] flex items-center justify-center mb-5">
          <div className="text-center text-[var(--foreground-subtle)]">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Map view coming soon</p>
            <p className="text-xs mt-1 opacity-60">
              {location.locality}, Bengaluru
            </p>
          </div>
        </div>

        {/* Connectivity */}
        {location.connectivity.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-[var(--foreground-muted)] uppercase tracking-wide mb-3">
              Connectivity
            </h3>
            <ul className="space-y-2.5">
              {location.connectivity.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm text-[var(--foreground)]"
                >
                  <Train className="w-4 h-4 text-[var(--foreground-subtle)] flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
