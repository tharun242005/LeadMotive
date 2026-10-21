import Link from "next/link";
import { Home, Search } from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { PROPERTIES } from "@/lib/demo/demo-data";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main
        id="main-content"
        className="flex-1 flex items-center justify-center px-4 py-20"
      >
        <div className="text-center max-w-lg animate-fade-up">
          <div className="w-20 h-20 rounded-2xl bg-[var(--surface-elevated)] flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-[var(--foreground-subtle)]" />
          </div>

          <h1 className="text-3xl font-bold mb-3">Property Not Found</h1>
          <p className="text-[var(--foreground-muted)] mb-8">
            The property you&apos;re looking for doesn&apos;t exist in our demo
            inventory. Try one of the available properties below.
          </p>

          <div className="space-y-3 mb-8">
            {PROPERTIES.map((property) => (
              <Link
                key={property.slug}
                href={`/ad/${property.slug}`}
                className="card card-interactive p-4 flex items-center gap-4 text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-[oklch(0.58_0.16_70_/_0.1)] flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-[oklch(0.50_0.15_68)]" />
                </div>
                <div>
                  <p className="font-semibold text-sm group-hover:text-[oklch(0.50_0.15_68)] transition-colors">
                    {property.name}
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {property.location.locality}, Bengaluru ·{" "}
                    {property.priceRangeLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
