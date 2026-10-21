import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getPropertyBySlug,
  getBuilderForProperty,
  getAllPropertySlugs,
  type DemoProperty,
  type DemoBuilder,
} from "@/lib/demo/demo-data";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import PropertyHero from "@/components/property/PropertyHero";
import PropertyHighlights from "@/components/property/PropertyHighlights";
import PropertyAmenities from "@/components/property/PropertyAmenities";
import PropertyLocationSection from "@/components/property/PropertyLocation";
import PropertyFAQ from "@/components/property/PropertyFAQ";
import BuilderBadge from "@/components/property/BuilderBadge";
import InquiryForm from "@/components/property/InquiryForm";

// Generate static params for the 3 demo properties
export function generateStaticParams() {
  return getAllPropertySlugs().map((slug) => ({ slug }));
}

// Dynamic metadata per property
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);
  if (!property) {
    return { title: "Property Not Found" };
  }

  const builder = getBuilderForProperty(property);

  return {
    title: `${property.name} — ${property.location.locality}, Bengaluru`,
    description: `${property.headline}. ${property.priceRangeLabel} · ${property.areaRangeLabel}. By ${builder?.name ?? "Unknown Builder"}. DEMO — All data is synthetic.`,
    robots: "noindex, nofollow",
  };
}

export default async function PropertyAdPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const builder = getBuilderForProperty(property);

  if (!builder) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <PropertyHero property={property} builderName={builder.name} />

        {/* Content sections */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 space-y-12 sm:space-y-16">
          {/* Key highlights */}
          <PropertyHighlights property={property} />

          {/* Two-column layout for larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-10">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-12 sm:space-y-16">
              {/* Amenities */}
              <PropertyAmenities amenities={property.amenities} />

              {/* Location */}
              <PropertyLocationSection location={property.location} />

              {/* FAQs */}
              <PropertyFAQ faqs={property.faqs} />
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Builder */}
              <BuilderBadge builder={builder} />

              {/* Inquiry form */}
              <div className="lg:sticky lg:top-24">
                <InquiryForm
                  propertyName={property.name}
                  propertySlug={property.slug}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
