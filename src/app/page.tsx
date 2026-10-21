import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  Globe,
  MessageCircle,
  Calendar,
} from "lucide-react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { PROPERTIES, getBuilderForProperty } from "@/lib/demo/demo-data";

export default function HomePage() {
  const features = [
    {
      icon: Globe,
      title: "Six Languages",
      description:
        "Conversations in English, Hindi, Kannada, Telugu, Tamil, and Malayalam.",
    },
    {
      icon: MessageCircle,
      title: "AI Voice & Text",
      description:
        "Property-scoped conversations powered by AI. Ask anything about the property.",
    },
    {
      icon: Calendar,
      title: "Book Site Visits",
      description:
        "Check available slots and book a site visit — all within the conversation.",
    },
  ];

  return (
    <>
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Hero section */}
        <section className="relative overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
            <div className="max-w-3xl animate-fade-up">
              <span className="badge badge-brand mb-4 text-sm">
                Bengaluru Real Estate Demo
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
                Intelligent Property{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-amber-500">
                  Conversations
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed">
                Discover premium Bengaluru properties. Ask questions in your
                language. Book site visits — all through an AI-powered
                conversation.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/ad/project-aster"
                  className="btn btn-primary btn-lg group"
                >
                  Explore Properties
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="#properties" className="btn btn-lg bg-white/10 text-white border border-white/20 hover:bg-white/15">
                  View All
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-20 bg-[var(--surface-elevated)]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                How It Works
              </h2>
              <p className="text-[var(--foreground-muted)] max-w-xl mx-auto">
                From property discovery to site-visit booking, powered by
                multilingual AI.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 stagger-children">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="card p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[oklch(0.58_0.16_70_/_0.1)] flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-[oklch(0.50_0.15_68)]" />
                    </div>
                    <h3 className="font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Properties */}
        <section id="properties" className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Explore Properties
              </h2>
              <p className="text-[var(--foreground-muted)] max-w-xl mx-auto">
                Browse our demo property listings in Bengaluru. All data is
                synthetic and for demonstration purposes only.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {PROPERTIES.map((property) => {
                const builder = getBuilderForProperty(property);
                return (
                  <Link
                    key={property.slug}
                    href={`/ad/${property.slug}`}
                    className="card card-interactive overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={property.heroImageUrl}
                        alt={property.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className="badge badge-warning text-[0.625rem]">
                          DEMO
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-1 group-hover:text-[oklch(0.50_0.15_68)] transition-colors">
                        {property.name}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] mb-3">
                        {property.location.locality}, {property.location.city}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-[oklch(0.50_0.15_68)]">
                          {property.priceRangeLabel}
                        </span>
                        <span className="text-[var(--foreground-subtle)] text-xs">
                          {property.configurations
                            .map((c) => c.type)
                            .join(" · ")}
                        </span>
                      </div>

                      {builder && (
                        <p className="text-xs text-[var(--foreground-subtle)] mt-3 pt-3 border-t border-[var(--border-subtle)]">
                          By {builder.name}
                        </p>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-5 pb-5">
                      <span className="btn btn-secondary w-full text-sm group-hover:bg-[oklch(0.58_0.16_70_/_0.08)] group-hover:border-[oklch(0.58_0.16_70_/_0.3)] group-hover:text-[oklch(0.50_0.15_68)] transition-all">
                        View Property
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
