import {
  Home,
  IndianRupee,
  Ruler,
  CalendarClock,
} from "lucide-react";
import type { DemoProperty } from "@/lib/demo/demo-data";

interface PropertyHighlightsProps {
  property: DemoProperty;
}

export default function PropertyHighlights({
  property,
}: PropertyHighlightsProps) {
  const highlights = [
    {
      icon: Home,
      label: "Configurations",
      value: property.configurations.map((c) => c.type).join(" · "),
    },
    {
      icon: IndianRupee,
      label: "Price Range",
      value: property.priceRangeLabel,
    },
    {
      icon: Ruler,
      label: "Area Range",
      value: property.areaRangeLabel,
    },
    ...(property.possessionStatus
      ? [
          {
            icon: CalendarClock,
            label: "Possession",
            value: property.possessionStatus,
          },
        ]
      : []),
  ];

  return (
    <section aria-label="Key highlights" className="animate-fade-up">
      <h2 className="text-xl font-bold mb-4">Key Highlights</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="card p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.58_0.16_70_/_0.1)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[oklch(0.50_0.15_68)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--foreground-subtle)] uppercase tracking-wide mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-[var(--foreground)] leading-snug">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration details */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)]">
                Configuration
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)]">
                Area (sq. ft.)
              </th>
              <th className="text-left py-3 px-4 font-semibold text-[var(--foreground-muted)]">
                Price Range (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {property.configurations.map((config) => (
              <tr
                key={config.type}
                className="border-b border-[var(--border-subtle)] last:border-0"
              >
                <td className="py-3 px-4 font-medium">{config.type}</td>
                <td className="py-3 px-4 text-[var(--foreground-muted)]">
                  {config.areaSqftMin.toLocaleString("en-IN")}–
                  {config.areaSqftMax.toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-4 text-[var(--foreground-muted)]">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(config.priceMinInr)}
                  {" – "}
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(config.priceMaxInr)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
