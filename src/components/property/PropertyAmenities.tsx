import {
  Trees,
  Dumbbell,
  Waves,
  Baby,
  Gamepad2,
  PersonStanding,
  Car,
  Zap,
  ShieldCheck,
  Droplets,
  Building,
  Puzzle,
  type LucideIcon,
} from "lucide-react";

interface PropertyAmenitiesProps {
  amenities: readonly string[];
}

/** Map amenity names to icons for a premium visual grid */
const AMENITY_ICONS: Record<string, LucideIcon> = {
  "Landscaped gardens": Trees,
  "Clubhouse": Building,
  "Swimming pool": Waves,
  "Children's play area": Baby,
  "Gymnasium": Dumbbell,
  "Indoor games room": Gamepad2,
  "Jogging track": PersonStanding,
  "Covered car parking": Car,
  "Power backup": Zap,
  "24/7 security with CCTV": ShieldCheck,
  "Rainwater harvesting": Droplets,
  "Multipurpose hall": Building,
  "Yoga and meditation deck": PersonStanding,
  "Senior citizen sit-out area": PersonStanding,
  "Badminton court": Gamepad2,
  "Party terrace": Building,
  "Visitor parking": Car,
  "Landscaped walking trails": Trees,
  "Mini theatre": Building,
  "Intercom facility": ShieldCheck,
  "Library and reading lounge": Building,
  "Pet park": Trees,
  "Organic garden": Trees,
};

function getAmenityIcon(name: string): LucideIcon {
  return AMENITY_ICONS[name] ?? Puzzle;
}

export default function PropertyAmenities({
  amenities,
}: PropertyAmenitiesProps) {
  return (
    <section aria-label="Amenities" className="animate-fade-up">
      <h2 className="text-xl font-bold mb-4">Amenities</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
        {amenities.map((amenity) => {
          const Icon = getAmenityIcon(amenity);
          return (
            <div
              key={amenity}
              className="card p-4 flex items-center gap-3 group card-interactive"
            >
              <div className="w-9 h-9 rounded-lg bg-[oklch(0.62_0.16_180_/_0.08)] flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[oklch(0.62_0.16_180_/_0.15)]">
                <Icon className="w-4.5 h-4.5 text-[oklch(0.52_0.14_180)]" />
              </div>
              <span className="text-sm font-medium leading-tight">
                {amenity}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
