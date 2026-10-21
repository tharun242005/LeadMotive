"use client";

import Image from "next/image";
import { MapPin, Badge } from "lucide-react";
import type { DemoProperty } from "@/lib/demo/demo-data";

interface PropertyHeroProps {
  property: DemoProperty;
  builderName: string;
}

export default function PropertyHero({
  property,
  builderName,
}: PropertyHeroProps) {
  return (
    <section
      className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] lg:aspect-[3/1] min-h-[320px] max-h-[560px] overflow-hidden"
      aria-label="Property hero"
    >
      {/* Background image */}
      <Image
        src={property.heroImageUrl}
        alt={`${property.name} — ${property.location.locality}, Bengaluru`}
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 lg:pb-12">
          <div className="animate-fade-up">
            {/* Demo badge */}
            <span className="inline-flex items-center gap-1.5 badge badge-warning mb-3 text-xs">
              <Badge className="w-3 h-3" />
              DEMO PROPERTY
            </span>

            {/* Property name */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
              {property.name}
            </h1>

            {/* Location */}
            <div className="flex items-center gap-2 text-white/80 text-base sm:text-lg mb-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span>
                {property.location.locality}, {property.location.city}
              </span>
            </div>

            {/* Headline */}
            <p className="text-white/70 text-sm sm:text-base max-w-2xl">
              {property.headline}
            </p>

            {/* Builder attribution */}
            <p className="text-white/50 text-xs mt-3">
              By {builderName}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
