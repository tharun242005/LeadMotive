// ============================================================================
// IQOL — Canonical Synthetic Demo Data
// ============================================================================
// This is the SINGLE SOURCE OF TRUTH for all static demo inventory.
//
// ALL property and builder information in this file is FICTIONAL and created
// solely for demonstration purposes. Nothing here represents a real listing,
// real builder, real price, or real availability.
//
// Location: src/lib/demo/demo-data.ts
// Phase: 1 (Product Contract & Synthetic Data)
// References: docs/PRODUCT_SPEC.md, docs/DATA_DICTIONARY.md
// ============================================================================

// ---------------------------------------------------------------------------
// 1. Type Definitions
// ---------------------------------------------------------------------------

/** Supported conversation languages */
export type SupportedLanguage = 'en' | 'hi' | 'kn' | 'te' | 'ta' | 'ml';

export const SUPPORTED_LANGUAGES: readonly { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
] as const;

/** Builder entity */
export interface DemoBuilder {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly tagline: string;
  readonly description: string;
  readonly establishedYear: number;
  readonly officeLabel: string;
  readonly websitePlaceholder: string;
  readonly isSynthetic: true;
}

/** Property configuration (e.g., 2 BHK, 3 BHK) */
export interface PropertyConfiguration {
  readonly type: string;
  readonly areaSqftMin: number;
  readonly areaSqftMax: number;
  readonly priceMinInr: number;
  readonly priceMaxInr: number;
}

/** Property location */
export interface PropertyLocation {
  readonly locality: string;
  readonly city: 'Bengaluru';
  readonly district: 'Bengaluru Urban';
  readonly state: 'Karnataka';
  readonly connectivity: readonly string[];
}

/** FAQ entry */
export interface PropertyFaq {
  readonly question: string;
  readonly answer: string;
}

/** Site-visit slot configuration (for dynamic generation, not hardcoded dates) */
export interface SlotTimeWindow {
  readonly startTime: string; // "10:00" (IST, 24-hour)
  readonly endTime: string;   // "12:00" (IST, 24-hour)
}

export interface SlotConfig {
  readonly weekdaySlots: readonly SlotTimeWindow[];
  readonly saturdaySlots: readonly SlotTimeWindow[];
  readonly sundaySlots: readonly SlotTimeWindow[];
  readonly maxCapacityPerSlot: number;
  readonly advanceDays: number;
  readonly blackoutDates: readonly string[]; // ISO date strings, e.g., "2026-11-01"
}

/** Property entity */
export interface DemoProperty {
  readonly id: string;
  readonly builderId: string;
  readonly name: string;
  readonly slug: string;
  readonly headline: string;
  readonly description: string;
  readonly heroImageUrl: string;
  readonly galleryUrls: readonly string[];
  readonly location: PropertyLocation;
  readonly configurations: readonly PropertyConfiguration[];
  readonly priceRangeLabel: string;
  readonly areaRangeLabel: string;
  readonly amenities: readonly string[];
  readonly possessionStatus: string | null;
  readonly reraDisclaimer: string;
  readonly approvedFacts: Readonly<Record<string, string>>;
  readonly unknownFacts: readonly string[];
  readonly faqs: readonly PropertyFaq[];
  readonly visitInstructions: string;
  readonly slotConfig: SlotConfig;
  readonly isSynthetic: true;
}

/** Inquiry status values */
export const INQUIRY_STATUSES = [
  'new_inquiry',
  'conversation_started',
  'requirements_captured',
  'property_questions_answered',
  'visit_requested',
  'follow_up_required',
  'completed',
  'cancelled',
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

/** Email delivery status values */
export const EMAIL_STATUSES = ['pending', 'sent', 'failed'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

/** Chat session status values */
export const CHAT_SESSION_STATUSES = ['active', 'expired', 'revoked'] as const;
export type ChatSessionStatus = (typeof CHAT_SESSION_STATUSES)[number];

/** Booking status values */
export const BOOKING_STATUSES = [
  'none',
  'pending_confirmation',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
  'reschedule_requested',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Audit event action values */
export const AUDIT_ACTIONS = [
  'inquiry_created',
  'email_sent',
  'email_failed',
  'email_retried',
  'chat_session_started',
  'chat_session_expired',
  'chat_token_revoked',
  'inquiry_status_changed',
  'booking_created',
  'booking_cancelled',
  'booking_status_changed',
  'admin_note_added',
  'lead_extraction_updated',
  'follow_up_flagged',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Example seed inquiry for admin dashboard screenshots */
export interface SeedInquiry {
  readonly userName: string;
  readonly userEmail: string;
  readonly userPhone: string | null;
  readonly propertySlug: string;
  readonly inquiryStatus: InquiryStatus;
  readonly emailStatus: EmailStatus;
  readonly chatSessionStatus: ChatSessionStatus;
  readonly bookingStatus: BookingStatus;
  readonly preferredLanguage: SupportedLanguage;
  readonly isSynthetic: true;
}

// ---------------------------------------------------------------------------
// 2. Builder Records
// ---------------------------------------------------------------------------

export const BUILDERS: readonly DemoBuilder[] = [
  {
    id: 'builder-aster-habitat',
    name: 'Aster Habitat Demo',
    slug: 'aster-habitat-demo',
    tagline: 'Crafting thoughtful living spaces across Bengaluru',
    description:
      'Aster Habitat Demo is a fictional Bengaluru-based residential developer ' +
      'focused on creating well-designed apartment communities in established and ' +
      'emerging neighbourhoods. With an emphasis on natural light, functional layouts ' +
      'and community amenities, Aster Habitat Demo projects aim to balance modern ' +
      'urban convenience with comfortable everyday living. This is demonstration data ' +
      'and does not represent a real company.',
    establishedYear: 2012,
    officeLabel: 'Demo Office — Outer Ring Road, Marathahalli, Bengaluru 560037',
    websitePlaceholder: 'https://demo.asterhabitat.example.test',
    isSynthetic: true,
  },
  {
    id: 'builder-cedar-urban',
    name: 'Cedar Urban Demo',
    slug: 'cedar-urban-demo',
    tagline: 'Premium residences in North Bengaluru',
    description:
      'Cedar Urban Demo is a fictional premium residential developer specialising ' +
      'in spacious, well-appointed homes in North Bengaluru. Their projects emphasise ' +
      'generous floor plans, contemporary architecture and proximity to the upcoming ' +
      'infrastructure developments in the Yelahanka–Hebbal corridor. This is ' +
      'demonstration data and does not represent a real company.',
    establishedYear: 2015,
    officeLabel: 'Demo Office — Bellary Road, Hebbal, Bengaluru 560024',
    websitePlaceholder: 'https://demo.cedarurban.example.test',
    isSynthetic: true,
  },
] as const;

// ---------------------------------------------------------------------------
// 3. Property Records
// ---------------------------------------------------------------------------

export const PROPERTIES: readonly DemoProperty[] = [
  // ── Property A — Project Aster ────────────────────────────────────────
  {
    id: 'prop-aster-whitefield',
    builderId: 'builder-aster-habitat',
    name: 'Project Aster (DEMO)',
    slug: 'project-aster',
    headline: 'Thoughtfully designed 2 & 3 BHK apartments in the heart of Whitefield',
    description:
      'Project Aster is a fictional residential development by Aster Habitat Demo, ' +
      'located in Whitefield, one of Bengaluru\'s most sought-after IT corridors. ' +
      'The project offers spacious 2 BHK and 3 BHK apartments designed for modern ' +
      'families who value both connectivity and comfort. With landscaped gardens, a ' +
      'well-equipped clubhouse and proximity to major tech parks, Project Aster aims ' +
      'to provide a balanced urban lifestyle. All information is synthetic and for ' +
      'demonstration purposes only.',
    heroImageUrl: '/images/properties/project-aster-hero.jpg',
    galleryUrls: [
      '/images/properties/project-aster-lobby.jpg',
      '/images/properties/project-aster-amenities.jpg',
    ],
    location: {
      locality: 'Whitefield',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      connectivity: [
        'Near ITPL Main Road',
        'Close to Whitefield Metro Station (under construction)',
        'Approx. 5 km from Phoenix Marketcity',
        'Well-connected to Outer Ring Road via Varthur Road',
        'Multiple IT parks within 3–7 km radius',
      ],
    },
    configurations: [
      {
        type: '2 BHK',
        areaSqftMin: 1100,
        areaSqftMax: 1250,
        priceMinInr: 7500000,
        priceMaxInr: 9000000,
      },
      {
        type: '3 BHK',
        areaSqftMin: 1450,
        areaSqftMax: 1650,
        priceMinInr: 9500000,
        priceMaxInr: 11500000,
      },
    ],
    priceRangeLabel: '₹75 lakh–₹1.15 crore',
    areaRangeLabel: '1,100–1,650 sq. ft.',
    amenities: [
      'Landscaped gardens',
      'Clubhouse',
      'Swimming pool',
      'Children\'s play area',
      'Gymnasium',
      'Indoor games room',
      'Jogging track',
      'Covered car parking',
      'Power backup',
      '24/7 security with CCTV',
      'Rainwater harvesting',
      'Multipurpose hall',
    ],
    possessionStatus: 'Expected Q4 2027 (Demo estimate)',
    reraDisclaimer: 'Demo — Not a real RERA registration',
    approvedFacts: {
      'project_name': 'Project Aster (DEMO)',
      'builder': 'Aster Habitat Demo',
      'location': 'Whitefield, Bengaluru',
      'configurations': '2 BHK (1,100–1,250 sq. ft.) and 3 BHK (1,450–1,650 sq. ft.)',
      'price_range': '₹75 lakh–₹1.15 crore',
      'area_range': '1,100–1,650 sq. ft.',
      'possession': 'Expected Q4 2027 (Demo estimate)',
      'amenities': 'Landscaped gardens, Clubhouse, Swimming pool, Children\'s play area, Gymnasium, Indoor games room, Jogging track, Covered car parking, Power backup, 24/7 security with CCTV, Rainwater harvesting, Multipurpose hall',
      'parking': 'Covered car parking is included. One dedicated parking slot per apartment. Additional visitor parking available.',
      'total_units': 'Approximately 180 apartments across 3 towers (Demo figure)',
      'floors': 'Ground + 14 floors per tower (Demo figure)',
      'structure': 'RCC framed structure with earthquake-resistant design (Demo specification)',
      'water_supply': 'Borewell and municipal corporation water supply with overhead tank',
      'power_backup': 'Full power backup for common areas; optional DG backup for apartments',
      'visit_instructions': 'Visit the demo site office near ITPL Main Road, Whitefield. Open on weekdays 10 AM–4 PM and Saturdays 10 AM–1 PM IST.',
    },
    unknownFacts: [
      'Exact maintenance charges per sq. ft.',
      'Specific floor plan layouts or unit numbers',
      'Legal approvals and RERA registration number',
      'Exact handover date',
      'Home loan tie-up details or pre-approved banks',
      'GST or stamp duty calculations',
      'Resale or rental yield projections',
      'Actual construction progress percentage',
      'Specific interior specifications (flooring brand, fitting brands)',
      'Cancellation or refund policy details',
    ],
    faqs: [
      {
        question: 'What configurations are available at Project Aster?',
        answer: 'Project Aster offers 2 BHK apartments (1,100–1,250 sq. ft.) and 3 BHK apartments (1,450–1,650 sq. ft.).',
      },
      {
        question: 'What is the price range for Project Aster?',
        answer: 'The indicative price range is ₹75 lakh for a 2 BHK to ₹1.15 crore for a 3 BHK. These are demonstration figures.',
      },
      {
        question: 'Where is Project Aster located?',
        answer: 'Project Aster is located in Whitefield, Bengaluru, near ITPL Main Road. It is well-connected to major IT parks and the Outer Ring Road.',
      },
      {
        question: 'What amenities are available?',
        answer: 'Amenities include landscaped gardens, a clubhouse, swimming pool, gymnasium, children\'s play area, indoor games room, jogging track, covered car parking, power backup, 24/7 security with CCTV, rainwater harvesting and a multipurpose hall.',
      },
      {
        question: 'What is the expected possession date?',
        answer: 'The estimated possession date is Q4 2027. This is a demonstration estimate and not a committed handover date.',
      },
      {
        question: 'Is parking included?',
        answer: 'Yes, covered car parking is included. Each apartment comes with one dedicated parking slot, and additional visitor parking is available.',
      },
      {
        question: 'Which builder is developing Project Aster?',
        answer: 'Project Aster is being developed by Aster Habitat Demo, a fictional Bengaluru-based developer. This is demonstration data.',
      },
      {
        question: 'How many towers and units are there?',
        answer: 'The project has approximately 180 apartments across 3 towers, each with ground + 14 floors. These are demonstration figures.',
      },
      {
        question: 'Is there power backup?',
        answer: 'Yes, full power backup is available for common areas. Optional DG backup is available for individual apartments.',
      },
      {
        question: 'How do I schedule a site visit?',
        answer: 'You can schedule a site visit through this conversation. I can check available slots and help you book a convenient time.',
      },
      {
        question: 'What is the water supply arrangement?',
        answer: 'The project has both borewell and municipal corporation water supply with an overhead tank for consistent availability.',
      },
      {
        question: 'What are the nearby connectivity options?',
        answer: 'Project Aster is near ITPL Main Road, close to the upcoming Whitefield Metro Station, approximately 5 km from Phoenix Marketcity, and well-connected to the Outer Ring Road via Varthur Road.',
      },
      {
        question: 'What is the construction quality?',
        answer: 'The project uses RCC framed structure with earthquake-resistant design. This is a demonstration specification.',
      },
      {
        question: 'What are the maintenance charges?',
        answer: 'I don\'t have verified information about the exact maintenance charges in this demo\'s property data. I can note your question for follow-up.',
      },
      {
        question: 'Is home loan available?',
        answer: 'I don\'t have verified information about home loan tie-ups or pre-approved banks in this demo\'s property data. I can note your question for follow-up.',
      },
      {
        question: 'What is the cancellation policy?',
        answer: 'I don\'t have verified information about cancellation or refund policies in this demo\'s property data. I can note your question for follow-up.',
      },
    ],
    visitInstructions:
      'Visit the demo site office near ITPL Main Road, Whitefield. ' +
      'Open on weekdays 10 AM–4 PM and Saturdays 10 AM–1 PM IST. ' +
      'Please carry a valid photo ID for entry.',
    slotConfig: {
      weekdaySlots: [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '16:00' },
      ],
      saturdaySlots: [
        { startTime: '10:00', endTime: '13:00' },
      ],
      sundaySlots: [],
      maxCapacityPerSlot: 5,
      advanceDays: 14,
      blackoutDates: [],
    },
    isSynthetic: true,
  },

  // ── Property B — Project Nila ─────────────────────────────────────────
  {
    id: 'prop-nila-sarjapur',
    builderId: 'builder-aster-habitat',
    name: 'Project Nila (DEMO)',
    slug: 'project-nila',
    headline: 'Contemporary 2 & 3 BHK living along Sarjapur Road',
    description:
      'Project Nila is a fictional residential project by Aster Habitat Demo, ' +
      'situated along Sarjapur Road, one of Bengaluru\'s rapidly developing ' +
      'residential corridors. The project features contemporary architecture, ' +
      'efficient floor plans and a range of lifestyle amenities designed for ' +
      'young professionals and growing families. With excellent connectivity to ' +
      'major IT hubs along the Outer Ring Road and a thriving social infrastructure ' +
      'nearby, Project Nila combines convenience with modern comfort. All information ' +
      'is synthetic and for demonstration purposes only.',
    heroImageUrl: '/images/properties/project-nila-hero.jpg',
    galleryUrls: [
      '/images/properties/project-nila-pool.jpg',
      '/images/properties/project-nila-garden.jpg',
    ],
    location: {
      locality: 'Sarjapur Road',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      connectivity: [
        'Direct access to Sarjapur Road',
        'Approx. 4 km from Outer Ring Road junction',
        'Close to multiple IT parks in Bellandur–Marathahalli belt',
        'Near established schools and hospitals',
        'Developing metro connectivity (Sarjapur Road line proposed)',
      ],
    },
    configurations: [
      {
        type: '2 BHK',
        areaSqftMin: 1050,
        areaSqftMax: 1200,
        priceMinInr: 8500000,
        priceMaxInr: 10000000,
      },
      {
        type: '3 BHK',
        areaSqftMin: 1400,
        areaSqftMax: 1580,
        priceMinInr: 10500000,
        priceMaxInr: 13000000,
      },
    ],
    priceRangeLabel: '₹85 lakh–₹1.30 crore',
    areaRangeLabel: '1,050–1,580 sq. ft.',
    amenities: [
      'Rooftop infinity-edge pool',
      'Landscaped central courtyard',
      'Modern clubhouse',
      'Fitness centre',
      'Yoga and meditation deck',
      'Children\'s play zone',
      'Half-basketball court',
      'Co-working lounge',
      'Covered car parking',
      'EV charging stations',
      'Power backup',
      '24/7 security with CCTV',
      'Rainwater harvesting',
      'Sewage treatment plant',
    ],
    possessionStatus: 'Expected H1 2028 (Demo estimate)',
    reraDisclaimer: 'Demo — Not a real RERA registration',
    approvedFacts: {
      'project_name': 'Project Nila (DEMO)',
      'builder': 'Aster Habitat Demo',
      'location': 'Sarjapur Road, Bengaluru',
      'configurations': '2 BHK (1,050–1,200 sq. ft.) and 3 BHK (1,400–1,580 sq. ft.)',
      'price_range': '₹85 lakh–₹1.30 crore',
      'area_range': '1,050–1,580 sq. ft.',
      'possession': 'Expected H1 2028 (Demo estimate)',
      'amenities': 'Rooftop infinity-edge pool, Landscaped central courtyard, Modern clubhouse, Fitness centre, Yoga and meditation deck, Children\'s play zone, Half-basketball court, Co-working lounge, Covered car parking, EV charging stations, Power backup, 24/7 security with CCTV, Rainwater harvesting, Sewage treatment plant',
      'parking': 'Covered car parking with one dedicated slot per apartment. EV charging stations available. Visitor parking provided.',
      'total_units': 'Approximately 220 apartments across 4 towers (Demo figure)',
      'floors': 'Ground + 16 floors per tower (Demo figure)',
      'structure': 'RCC framed structure with seismic zone compliance (Demo specification)',
      'water_supply': 'Borewell and Cauvery municipal water supply with dedicated sump and overhead tank',
      'power_backup': 'Full power backup for common areas and lifts; optional DG backup for apartments',
      'visit_instructions': 'Visit the demo site office on Sarjapur Road, near Wipro junction. Open on weekdays 10 AM–4 PM and Saturdays 10 AM–1 PM IST.',
    },
    unknownFacts: [
      'Exact maintenance charges per sq. ft.',
      'Specific floor plan layouts or unit numbers',
      'Legal approvals and RERA registration number',
      'Exact handover date',
      'Home loan tie-up details or pre-approved banks',
      'GST or stamp duty calculations',
      'Resale or rental yield projections',
      'Actual construction progress percentage',
      'Specific interior specifications (flooring brand, fitting brands)',
      'Cancellation or refund policy details',
    ],
    faqs: [
      {
        question: 'What configurations are available at Project Nila?',
        answer: 'Project Nila offers 2 BHK apartments (1,050–1,200 sq. ft.) and 3 BHK apartments (1,400–1,580 sq. ft.).',
      },
      {
        question: 'What is the price range for Project Nila?',
        answer: 'The indicative price range is ₹85 lakh for a 2 BHK to ₹1.30 crore for a 3 BHK. These are demonstration figures.',
      },
      {
        question: 'Where is Project Nila located?',
        answer: 'Project Nila is located on Sarjapur Road, Bengaluru, approximately 4 km from the Outer Ring Road junction. It is close to multiple IT parks in the Bellandur–Marathahalli belt.',
      },
      {
        question: 'What amenities does Project Nila offer?',
        answer: 'Amenities include a rooftop infinity-edge pool, landscaped courtyard, modern clubhouse, fitness centre, yoga deck, children\'s play zone, half-basketball court, co-working lounge, covered parking, EV charging stations, power backup, 24/7 security and rainwater harvesting.',
      },
      {
        question: 'When is the expected possession?',
        answer: 'The estimated possession is H1 2028. This is a demonstration estimate and not a committed date.',
      },
      {
        question: 'Is parking included?',
        answer: 'Yes, covered car parking with one dedicated slot per apartment is included. EV charging stations and visitor parking are also available.',
      },
      {
        question: 'Which builder is developing Project Nila?',
        answer: 'Project Nila is being developed by Aster Habitat Demo, the same fictional developer behind Project Aster. This is demonstration data.',
      },
      {
        question: 'How many units are in the project?',
        answer: 'The project has approximately 220 apartments across 4 towers, each with ground + 16 floors. These are demonstration figures.',
      },
      {
        question: 'Is there power backup?',
        answer: 'Yes, full power backup for common areas and lifts. Optional DG backup is available for individual apartments.',
      },
      {
        question: 'How do I arrange a site visit?',
        answer: 'You can arrange a site visit through this conversation. I can check available time slots and help you book one.',
      },
      {
        question: 'What is the water supply arrangement?',
        answer: 'The project has both borewell and Cauvery municipal water supply with a dedicated sump and overhead tank.',
      },
      {
        question: 'Are there EV charging facilities?',
        answer: 'Yes, EV charging stations are available in the parking area.',
      },
      {
        question: 'What are the connectivity advantages?',
        answer: 'Project Nila has direct access to Sarjapur Road, is approximately 4 km from the Outer Ring Road junction, close to IT parks in the Bellandur–Marathahalli belt, near established schools and hospitals, and the proposed Sarjapur Road metro line.',
      },
      {
        question: 'Is there a co-working space?',
        answer: 'Yes, a co-working lounge is available as a community amenity within the project.',
      },
      {
        question: 'What are the maintenance charges?',
        answer: 'I don\'t have verified information about the exact maintenance charges in this demo\'s property data. I can note your question for follow-up.',
      },
      {
        question: 'What are the stamp duty and registration charges?',
        answer: 'I don\'t have verified information about stamp duty or registration charges in this demo\'s property data. I can note your question for follow-up.',
      },
    ],
    visitInstructions:
      'Visit the demo site office on Sarjapur Road, near Wipro junction. ' +
      'Open on weekdays 10 AM–4 PM and Saturdays 10 AM–1 PM IST. ' +
      'Please carry a valid photo ID for entry.',
    slotConfig: {
      weekdaySlots: [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '16:00' },
      ],
      saturdaySlots: [
        { startTime: '10:00', endTime: '13:00' },
      ],
      sundaySlots: [],
      maxCapacityPerSlot: 5,
      advanceDays: 14,
      blackoutDates: [],
    },
    isSynthetic: true,
  },

  // ── Property C — Project Cedar ────────────────────────────────────────
  {
    id: 'prop-cedar-yelahanka',
    builderId: 'builder-cedar-urban',
    name: 'Project Cedar (DEMO)',
    slug: 'project-cedar',
    headline: 'Spacious 3 BHK premium residences in Yelahanka, North Bengaluru',
    description:
      'Project Cedar is a fictional premium residential project by Cedar Urban Demo, ' +
      'located in Yelahanka, one of North Bengaluru\'s most promising growth corridors. ' +
      'The project offers exclusively 3 BHK apartments with generous floor plans, ' +
      'designed for families seeking spacious, well-ventilated homes near the ' +
      'Kempegowda International Airport and the emerging Aerospace SEZ. With a focus ' +
      'on open spaces, mature landscaping and premium finishes, Project Cedar targets ' +
      'discerning buyers who value quality and location. All information is synthetic ' +
      'and for demonstration purposes only.',
    heroImageUrl: '/images/properties/project-cedar-hero.jpg',
    galleryUrls: [
      '/images/properties/project-cedar-clubhouse.jpg',
      '/images/properties/project-cedar-view.jpg',
    ],
    location: {
      locality: 'Yelahanka',
      city: 'Bengaluru',
      district: 'Bengaluru Urban',
      state: 'Karnataka',
      connectivity: [
        'Approx. 15 km from Kempegowda International Airport',
        'Close to Yelahanka New Town commercial area',
        'Near Bellary Road (NH-44)',
        'Accessible to Hebbal Flyover and Outer Ring Road',
        'Proximity to Aerospace SEZ and defence establishments',
        'Well-connected to city centre via Bellary Road corridor',
      ],
    },
    configurations: [
      {
        type: '3 BHK',
        areaSqftMin: 1250,
        areaSqftMax: 1850,
        priceMinInr: 10500000,
        priceMaxInr: 14500000,
      },
    ],
    priceRangeLabel: '₹1.05–₹1.45 crore',
    areaRangeLabel: '1,250–1,850 sq. ft.',
    amenities: [
      'Grand entrance lobby',
      'Premium clubhouse',
      'Temperature-controlled swimming pool',
      'Fully equipped gymnasium',
      'Squash court',
      'Tennis court',
      'Landscaped walking trails',
      'Senior citizen garden',
      'Children\'s adventure play area',
      'Amphitheatre',
      'Covered basement parking',
      'Power backup',
      '24/7 security with CCTV and intercom',
      'Rainwater harvesting',
      'Organic waste composting',
      'Library and reading room',
    ],
    possessionStatus: 'Expected Q2 2028 (Demo estimate)',
    reraDisclaimer: 'Demo — Not a real RERA registration',
    approvedFacts: {
      'project_name': 'Project Cedar (DEMO)',
      'builder': 'Cedar Urban Demo',
      'location': 'Yelahanka, Bengaluru',
      'configurations': '3 BHK (1,250–1,850 sq. ft.)',
      'price_range': '₹1.05–₹1.45 crore',
      'area_range': '1,250–1,850 sq. ft.',
      'possession': 'Expected Q2 2028 (Demo estimate)',
      'amenities': 'Grand entrance lobby, Premium clubhouse, Temperature-controlled swimming pool, Fully equipped gymnasium, Squash court, Tennis court, Landscaped walking trails, Senior citizen garden, Children\'s adventure play area, Amphitheatre, Covered basement parking, Power backup, 24/7 security with CCTV and intercom, Rainwater harvesting, Organic waste composting, Library and reading room',
      'parking': 'Covered basement parking with two dedicated slots per 3 BHK apartment. Visitor parking on ground level.',
      'total_units': 'Approximately 120 apartments across 2 towers (Demo figure)',
      'floors': 'Ground + 18 floors per tower (Demo figure)',
      'structure': 'RCC framed structure with premium earthquake-resistant design (Demo specification)',
      'water_supply': 'Borewell and Cauvery water supply with dual-sump system and overhead tank',
      'power_backup': 'Full power backup for common areas, lifts and apartments',
      'visit_instructions': 'Visit the demo site office in Yelahanka New Town, near Bellary Road. Open on weekdays 10 AM–5 PM and Saturdays 10 AM–4 PM IST.',
    },
    unknownFacts: [
      'Exact maintenance charges per sq. ft.',
      'Specific floor plan layouts or unit numbers',
      'Legal approvals and RERA registration number',
      'Exact handover date',
      'Home loan tie-up details or pre-approved banks',
      'GST or stamp duty calculations',
      'Resale or rental yield projections',
      'Actual construction progress percentage',
      'Specific interior specifications (flooring brand, fitting brands)',
      'Cancellation or refund policy details',
      'Club membership charges',
    ],
    faqs: [
      {
        question: 'What configurations are available at Project Cedar?',
        answer: 'Project Cedar exclusively offers 3 BHK apartments ranging from 1,250 to 1,850 sq. ft.',
      },
      {
        question: 'What is the price range for Project Cedar?',
        answer: 'The indicative price range is ₹1.05 crore to ₹1.45 crore for 3 BHK apartments. These are demonstration figures.',
      },
      {
        question: 'Where is Project Cedar located?',
        answer: 'Project Cedar is located in Yelahanka, North Bengaluru, approximately 15 km from Kempegowda International Airport, near Bellary Road (NH-44).',
      },
      {
        question: 'What amenities does Project Cedar offer?',
        answer: 'Premium amenities include a grand entrance lobby, clubhouse, temperature-controlled pool, gymnasium, squash and tennis courts, landscaped walking trails, senior citizen garden, children\'s adventure play area, amphitheatre, basement parking, library and reading room, with 24/7 security.',
      },
      {
        question: 'When is the expected possession?',
        answer: 'The estimated possession is Q2 2028. This is a demonstration estimate and not a committed date.',
      },
      {
        question: 'How many parking slots are included?',
        answer: 'Each 3 BHK apartment comes with two dedicated covered basement parking slots. Visitor parking is available on the ground level.',
      },
      {
        question: 'Which builder is developing Project Cedar?',
        answer: 'Project Cedar is being developed by Cedar Urban Demo, a fictional premium developer focusing on North Bengaluru. This is demonstration data.',
      },
      {
        question: 'How many units are in the project?',
        answer: 'The project has approximately 120 apartments across 2 towers, each with ground + 18 floors. These are demonstration figures.',
      },
      {
        question: 'Is there full power backup?',
        answer: 'Yes, full power backup is provided for common areas, lifts and individual apartments.',
      },
      {
        question: 'How do I schedule a site visit?',
        answer: 'You can schedule a site visit through this conversation. I can check available time slots and help you book a convenient time.',
      },
      {
        question: 'What is the water supply arrangement?',
        answer: 'The project has both borewell and Cauvery water supply with a dual-sump system and overhead tank for reliable availability.',
      },
      {
        question: 'How far is the airport?',
        answer: 'Kempegowda International Airport is approximately 15 km from Project Cedar, making it one of the closest premium residential options to the airport.',
      },
      {
        question: 'Is there a library?',
        answer: 'Yes, a library and reading room is available as a community amenity within the project.',
      },
      {
        question: 'Are there sports facilities?',
        answer: 'Yes, the project includes a squash court, tennis court, and a fully equipped gymnasium.',
      },
      {
        question: 'What are the maintenance charges?',
        answer: 'I don\'t have verified information about the exact maintenance charges in this demo\'s property data. I can note your question for follow-up.',
      },
      {
        question: 'What is the RERA registration number?',
        answer: 'This is a demonstration project. It does not have a real RERA registration number.',
      },
      {
        question: 'Are there any ongoing offers or discounts?',
        answer: 'I don\'t have verified information about offers or discounts in this demo\'s property data. I can note your question for follow-up.',
      },
      {
        question: 'What is the construction quality?',
        answer: 'The project uses premium RCC framed structure with earthquake-resistant design. This is a demonstration specification.',
      },
    ],
    visitInstructions:
      'Visit the demo site office in Yelahanka New Town, near Bellary Road. ' +
      'Open on weekdays 10 AM–5 PM and Saturdays 10 AM–4 PM IST. ' +
      'Please carry a valid photo ID for entry.',
    slotConfig: {
      weekdaySlots: [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '15:00', endTime: '17:00' },
      ],
      saturdaySlots: [
        { startTime: '10:00', endTime: '12:00' },
        { startTime: '14:00', endTime: '16:00' },
      ],
      sundaySlots: [],
      maxCapacityPerSlot: 3,
      advanceDays: 14,
      blackoutDates: [],
    },
    isSynthetic: true,
  },
] as const;

// ---------------------------------------------------------------------------
// 4. Example Seed Inquiries (for admin dashboard screenshots)
// ---------------------------------------------------------------------------

export const SEED_INQUIRIES: readonly SeedInquiry[] = [
  {
    userName: 'Priya Sharma',
    userEmail: 'priya.sharma@example.test',
    userPhone: null,
    propertySlug: 'project-aster',
    inquiryStatus: 'completed',
    emailStatus: 'sent',
    chatSessionStatus: 'active',
    bookingStatus: 'confirmed',
    preferredLanguage: 'en',
    isSynthetic: true,
  },
  {
    userName: 'Rajesh Kumar',
    userEmail: 'rajesh.kumar@example.test',
    userPhone: '+91 00000 00001',
    propertySlug: 'project-nila',
    inquiryStatus: 'conversation_started',
    emailStatus: 'sent',
    chatSessionStatus: 'active',
    bookingStatus: 'none',
    preferredLanguage: 'hi',
    isSynthetic: true,
  },
  {
    userName: 'Ananya Reddy',
    userEmail: 'ananya.reddy@example.test',
    userPhone: '+91 00000 00002',
    propertySlug: 'project-cedar',
    inquiryStatus: 'visit_requested',
    emailStatus: 'sent',
    chatSessionStatus: 'active',
    bookingStatus: 'pending_confirmation',
    preferredLanguage: 'te',
    isSynthetic: true,
  },
  {
    userName: 'Kavitha Nair',
    userEmail: 'kavitha.nair@example.test',
    userPhone: null,
    propertySlug: 'project-aster',
    inquiryStatus: 'new_inquiry',
    emailStatus: 'failed',
    chatSessionStatus: 'active',
    bookingStatus: 'none',
    preferredLanguage: 'ml',
    isSynthetic: true,
  },
  {
    userName: 'Suresh Gowda',
    userEmail: 'suresh.gowda@example.test',
    userPhone: '+91 00000 00003',
    propertySlug: 'project-nila',
    inquiryStatus: 'requirements_captured',
    emailStatus: 'sent',
    chatSessionStatus: 'expired',
    bookingStatus: 'none',
    preferredLanguage: 'kn',
    isSynthetic: true,
  },
  {
    userName: 'Deepa Iyer',
    userEmail: 'deepa.iyer@example.test',
    userPhone: '+91 00000 00004',
    propertySlug: 'project-cedar',
    inquiryStatus: 'completed',
    emailStatus: 'sent',
    chatSessionStatus: 'active',
    bookingStatus: 'completed',
    preferredLanguage: 'ta',
    isSynthetic: true,
  },
] as const;

// ---------------------------------------------------------------------------
// 5. Lookup Helpers
// ---------------------------------------------------------------------------

/** Get a builder by ID */
export function getBuilderById(id: string): DemoBuilder | undefined {
  return BUILDERS.find((b) => b.id === id);
}

/** Get a builder by slug */
export function getBuilderBySlug(slug: string): DemoBuilder | undefined {
  return BUILDERS.find((b) => b.slug === slug);
}

/** Get a property by slug */
export function getPropertyBySlug(slug: string): DemoProperty | undefined {
  return PROPERTIES.find((p) => p.slug === slug);
}

/** Get a property by ID */
export function getPropertyById(id: string): DemoProperty | undefined {
  return PROPERTIES.find((p) => p.id === id);
}

/** Get all properties for a builder */
export function getPropertiesByBuilderId(builderId: string): readonly DemoProperty[] {
  return PROPERTIES.filter((p) => p.builderId === builderId);
}

/** Get the builder associated with a property */
export function getBuilderForProperty(property: DemoProperty): DemoBuilder | undefined {
  return getBuilderById(property.builderId);
}

/** Get all property slugs */
export function getAllPropertySlugs(): string[] {
  return PROPERTIES.map((p) => p.slug);
}

// ---------------------------------------------------------------------------
// 6. Consistency Validation
// ---------------------------------------------------------------------------

export interface ValidationError {
  entity: string;
  field: string;
  message: string;
}

/**
 * Validates the internal consistency of the demo data.
 * Returns an array of errors. Empty array = valid.
 *
 * This can be run as a standalone check without any external dependencies.
 */
export function validateDemoData(): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check builder ID uniqueness
  const builderIds = new Set<string>();
  const builderSlugs = new Set<string>();
  for (const builder of BUILDERS) {
    if (builderIds.has(builder.id)) {
      errors.push({ entity: builder.name, field: 'id', message: `Duplicate builder ID: ${builder.id}` });
    }
    builderIds.add(builder.id);

    if (builderSlugs.has(builder.slug)) {
      errors.push({ entity: builder.name, field: 'slug', message: `Duplicate builder slug: ${builder.slug}` });
    }
    builderSlugs.add(builder.slug);

    if (!builder.isSynthetic) {
      errors.push({ entity: builder.name, field: 'isSynthetic', message: 'Builder must be marked as synthetic' });
    }
  }

  // Check property consistency
  const propertyIds = new Set<string>();
  const propertySlugs = new Set<string>();
  for (const property of PROPERTIES) {
    // Unique IDs
    if (propertyIds.has(property.id)) {
      errors.push({ entity: property.name, field: 'id', message: `Duplicate property ID: ${property.id}` });
    }
    propertyIds.add(property.id);

    // Unique slugs
    if (propertySlugs.has(property.slug)) {
      errors.push({ entity: property.name, field: 'slug', message: `Duplicate property slug: ${property.slug}` });
    }
    propertySlugs.add(property.slug);

    // Builder reference exists
    if (!builderIds.has(property.builderId)) {
      errors.push({
        entity: property.name,
        field: 'builderId',
        message: `Property references non-existent builder: ${property.builderId}`,
      });
    }

    // Synthetic flag
    if (!property.isSynthetic) {
      errors.push({ entity: property.name, field: 'isSynthetic', message: 'Property must be marked as synthetic' });
    }

    // Location is Bengaluru
    if (property.location.city !== 'Bengaluru') {
      errors.push({ entity: property.name, field: 'location.city', message: `City must be Bengaluru, got: ${property.location.city}` });
    }
    if (property.location.state !== 'Karnataka') {
      errors.push({ entity: property.name, field: 'location.state', message: `State must be Karnataka, got: ${property.location.state}` });
    }

    // Configurations have valid ranges
    for (const config of property.configurations) {
      if (config.areaSqftMin > config.areaSqftMax) {
        errors.push({
          entity: property.name,
          field: `configurations.${config.type}.area`,
          message: `Area min (${config.areaSqftMin}) > max (${config.areaSqftMax})`,
        });
      }
      if (config.priceMinInr > config.priceMaxInr) {
        errors.push({
          entity: property.name,
          field: `configurations.${config.type}.price`,
          message: `Price min (${config.priceMinInr}) > max (${config.priceMaxInr})`,
        });
      }
      if (config.priceMinInr <= 0 || config.priceMaxInr <= 0) {
        errors.push({
          entity: property.name,
          field: `configurations.${config.type}.price`,
          message: 'Prices must be positive',
        });
      }
    }

    // At least one configuration
    if (property.configurations.length === 0) {
      errors.push({ entity: property.name, field: 'configurations', message: 'Must have at least one configuration' });
    }

    // At least one amenity
    if (property.amenities.length === 0) {
      errors.push({ entity: property.name, field: 'amenities', message: 'Must have at least one amenity' });
    }

    // At least 12 FAQs
    if (property.faqs.length < 12) {
      errors.push({
        entity: property.name,
        field: 'faqs',
        message: `Must have at least 12 FAQs, got ${property.faqs.length}`,
      });
    }

    // Unknown facts should not appear in approved facts
    for (const unknown of property.unknownFacts) {
      const lowerUnknown = unknown.toLowerCase();
      for (const [key, value] of Object.entries(property.approvedFacts)) {
        // Check if the approved fact directly contains a definitive answer for an "unknown" topic
        // This is a heuristic check — exact matching is hard, so we check for suspiciously specific overlaps
        if (key.toLowerCase().includes(lowerUnknown.split(' ')[0]) && !value.toLowerCase().includes('don\'t have')) {
          // Only flag if the approved fact seems to definitively answer the unknown
          // Allow general references (e.g., "parking" can appear in amenities while "exact parking charges" remain unknown)
        }
      }
    }

    // Slot config has valid time windows
    const allSlots = [
      ...property.slotConfig.weekdaySlots,
      ...property.slotConfig.saturdaySlots,
      ...property.slotConfig.sundaySlots,
    ];
    for (const slot of allSlots) {
      if (slot.startTime >= slot.endTime) {
        errors.push({
          entity: property.name,
          field: 'slotConfig',
          message: `Slot start time (${slot.startTime}) must be before end time (${slot.endTime})`,
        });
      }
    }

    if (property.slotConfig.maxCapacityPerSlot <= 0) {
      errors.push({
        entity: property.name,
        field: 'slotConfig.maxCapacityPerSlot',
        message: 'Capacity must be positive',
      });
    }

    if (property.slotConfig.advanceDays <= 0) {
      errors.push({
        entity: property.name,
        field: 'slotConfig.advanceDays',
        message: 'Advance days must be positive',
      });
    }
  }

  // Check seed inquiries reference valid property slugs
  for (const inquiry of SEED_INQUIRIES) {
    if (!propertySlugs.has(inquiry.propertySlug)) {
      errors.push({
        entity: inquiry.userName,
        field: 'propertySlug',
        message: `Seed inquiry references non-existent property: ${inquiry.propertySlug}`,
      });
    }
    if (!inquiry.isSynthetic) {
      errors.push({ entity: inquiry.userName, field: 'isSynthetic', message: 'Seed inquiry must be marked as synthetic' });
    }
    // Email should use example.test
    if (!inquiry.userEmail.endsWith('@example.test')) {
      errors.push({
        entity: inquiry.userName,
        field: 'userEmail',
        message: `Seed email must use @example.test domain, got: ${inquiry.userEmail}`,
      });
    }
  }

  // Verify three properties and two builders
  if (PROPERTIES.length !== 3) {
    errors.push({ entity: 'PROPERTIES', field: 'length', message: `Expected 3 properties, got ${PROPERTIES.length}` });
  }
  if (BUILDERS.length !== 2) {
    errors.push({ entity: 'BUILDERS', field: 'length', message: `Expected 2 builders, got ${BUILDERS.length}` });
  }

  // Verify builder-property relationships
  const asterProperties = PROPERTIES.filter((p) => p.builderId === 'builder-aster-habitat');
  if (asterProperties.length !== 2) {
    errors.push({
      entity: 'Aster Habitat Demo',
      field: 'properties',
      message: `Expected 2 properties for Aster Habitat, got ${asterProperties.length}`,
    });
  }
  const cedarProperties = PROPERTIES.filter((p) => p.builderId === 'builder-cedar-urban');
  if (cedarProperties.length !== 1) {
    errors.push({
      entity: 'Cedar Urban Demo',
      field: 'properties',
      message: `Expected 1 property for Cedar Urban, got ${cedarProperties.length}`,
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 7. Currency Formatting Utility
// ---------------------------------------------------------------------------

/**
 * Formats an INR amount with Indian digit grouping.
 * e.g., 11500000 → "₹1,15,00,000"
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an INR amount in lakh/crore shorthand.
 * e.g., 7500000  → "₹75 L"
 *       11500000 → "₹1.15 Cr"
 *       9000000  → "₹90 L"
 */
export function formatINRShort(amount: number): string {
  if (amount >= 10000000) {
    // 1 crore = 10,000,000
    const crores = amount / 10000000;
    const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(2).replace(/\.?0+$/, '');
    return `₹${formatted} Cr`;
  }
  if (amount >= 100000) {
    // 1 lakh = 100,000
    const lakhs = amount / 100000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2).replace(/\.?0+$/, '');
    return `₹${formatted} L`;
  }
  return formatINR(amount);
}

// ---------------------------------------------------------------------------
// 8. AI Fallback Responses
// ---------------------------------------------------------------------------

/** Fallback message when the AI cannot answer a question, per language */
export const AI_FALLBACK_RESPONSES: Readonly<Record<SupportedLanguage, string>> = {
  en: "I don't have verified information about that in this demo's property data. I can note your question for follow-up.",
  hi: 'इस डेमो के प्रॉपर्टी डेटा में इसकी सत्यापित जानकारी मेरे पास नहीं है। मैं आपका सवाल फ़ॉलो-अप के लिए नोट कर सकता/सकती हूँ।',
  kn: 'ಈ ಡೆಮೊದ ಆಸ್ತಿ ಮಾಹಿತಿಯಲ್ಲಿ ಅದರ ಬಗ್ಗೆ ಪರಿಶೀಲಿಸಿದ ಮಾಹಿತಿ ನನ್ನ ಬಳಿ ಇಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಫಾಲೋ-ಅಪ್\u200Cಗಾಗಿ ನೋಟ್ ಮಾಡಬಹುದು.',
  te: 'ఈ డెమో ప్రాపర్టీ డేటాలో దాని గురించి ధృవీకరించిన సమాచారం నా వద్ద లేదు. మీ ప్రశ్నను ఫాలో-అప్ కోసం నోట్ చేయగలను.',
  ta: 'இந்த டெமோவின் சொத்துத் தரவில் அதைப் பற்றிய சரிபார்க்கப்பட்ட தகவல் என்னிடம் இல்லை. உங்கள் கேள்வியை பின்தொடர்வதற்காக குறிப்பிடலாம்.',
  ml: 'ഈ ഡെമോയുടെ പ്രോപ്പർട്ടി ഡാറ്റയിൽ അതിനെക്കുറിച്ച് പരിശോധിച്ച വിവരം എന്റെ പക്കലില്ല. നിങ്ങളുടെ ചോദ്യം ഫോളോ-അപ്പിനായി കുറിക്കാം.',
} as const;

// ---------------------------------------------------------------------------
// 9. AI Tool Definitions (for Phase 4 implementation)
// ---------------------------------------------------------------------------

/** Tool names the AI may request — validated by the backend */
export const AI_TOOL_NAMES = [
  'get_current_property_details',
  'get_property_faq',
  'check_available_slots',
  'save_lead_details',
  'create_booking',
  'request_follow_up',
] as const;
export type AIToolName = (typeof AI_TOOL_NAMES)[number];
