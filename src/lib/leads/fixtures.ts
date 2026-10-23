// ============================================================================
// LeadMotive — Synthetic Lead Fixtures
// ============================================================================
//
// Six diverse, internally consistent Bengaluru leads.
// All data is FICTIONAL. No real customer information.
//
// Each lead is designed to demonstrate a distinct customer intent, priority
// band and set of concerns so that the AI analysis produces visibly
// different results.
// ============================================================================

import type { Lead, LeadAnalysis } from "@/types/lead";
import { computePriority } from "@/lib/leads/scoring";

// ---------------------------------------------------------------------------
// Seeded example analyses (marked as isSeeded: true)
// These are pre-written to give an immediate preview of the analysis UI
// before any real AI call is made. The UI must label them as fixture data.
// ---------------------------------------------------------------------------

const seededAnalysis: Record<string, LeadAnalysis> = {
  "lead-001": {
    summary: "Priya is a highly motivated buyer looking for a family apartment in Whitefield. She has visited two projects already, has a clear budget of ₹1.2 Cr, and wants to finalise within a month. Her main concern is the quality of nearby schools for her children.",
    intent: "ready_to_buy",
    intentConfidence: 0.92,
    requirements: [
      { label: "3 BHK apartment", confidence: "explicit" },
      { label: "Gated community", confidence: "explicit" },
      { label: "Near good schools", confidence: "explicit" },
      { label: "1400+ sq ft", confidence: "explicit" },
      { label: "Ready to move in", confidence: "inferred" },
    ],
    objections: [
      { label: "Wants to confirm school quality nearby", severity: "medium" },
      { label: "Concerned about traffic on Whitefield Main Road", severity: "low" },
    ],
    recommendedAction: {
      type: "site_visit",
      description: "Schedule a site visit this weekend and prepare a list of top-rated schools within 3 km of the project.",
      timeframe: "Within 24 hours",
    },
    suggestedResponse: "Hi Priya! Thank you for your interest. I'd love to arrange a site visit for you this weekend. I've also compiled a list of CBSE and ICSE schools within 3 km of our Whitefield project — I'll share it along with the visit confirmation. Would Saturday morning work for you?",
    timeline: [
      { dayOffset: 0, action: "Send school list + confirm visit", channel: "whatsapp", completed: false },
      { dayOffset: 2, action: "Site visit", channel: "site_visit", completed: false },
      { dayOffset: 4, action: "Follow up on visit experience", channel: "call", completed: false },
      { dayOffset: 7, action: "Share pricing and payment plan", channel: "email", completed: false },
      { dayOffset: 14, action: "Check decision status", channel: "call", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
  },

  "lead-002": {
    summary: "Arjun is interested in a 2 BHK in Sarjapur Road but is worried about getting a home loan approved. He earns ₹90,000/month and needs clarity on EMI calculations and bank tie-ups. His timeline is 2–3 months but depends on financing.",
    intent: "actively_searching",
    intentConfidence: 0.78,
    requirements: [
      { label: "2 BHK apartment", confidence: "explicit" },
      { label: "Sarjapur Road area", confidence: "explicit" },
      { label: "Under ₹60 L", confidence: "explicit" },
      { label: "Home loan assistance", confidence: "explicit" },
    ],
    objections: [
      { label: "Uncertain about loan eligibility", severity: "high" },
      { label: "Worried about high EMI on ₹90K salary", severity: "high" },
      { label: "Wants to know builder-bank tie-ups", severity: "medium" },
    ],
    recommendedAction: {
      type: "call",
      description: "Call Arjun to explain pre-approved loan options, share EMI calculator, and connect with in-house loan counsellor.",
      timeframe: "Within 4 hours",
    },
    suggestedResponse: "Hi Arjun! I understand the financing side can feel overwhelming — let me simplify it for you. We have tie-ups with SBI, HDFC and ICICI, and many of our buyers in your salary range have comfortably managed EMIs. I'd like to connect you with our loan counsellor for a free eligibility check. Can I call you this evening around 6 PM?",
    timeline: [
      { dayOffset: 0, action: "Call to discuss financing", channel: "call", completed: false },
      { dayOffset: 1, action: "Share EMI calculator + bank options", channel: "whatsapp", completed: false },
      { dayOffset: 3, action: "Connect with loan counsellor", channel: "call", completed: false },
      { dayOffset: 10, action: "Follow up on loan pre-approval", channel: "call", completed: false },
      { dayOffset: 21, action: "Site visit after financing clarity", channel: "site_visit", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
  },

  "lead-003": {
    summary: "Meera wants a clear breakdown of total ownership cost for a villa in Hebbal. She is comparing two projects and needs to understand registration charges, GST, maintenance deposits and club membership fees beyond the base price.",
    intent: "comparing_options",
    intentConfidence: 0.85,
    requirements: [
      { label: "3 BHK villa or row house", confidence: "explicit" },
      { label: "Hebbal or North Bengaluru", confidence: "explicit" },
      { label: "Budget ₹2–2.5 Cr (all-inclusive)", confidence: "explicit" },
      { label: "Breakdown of total cost", confidence: "explicit" },
    ],
    objections: [
      { label: "Hidden costs beyond base price", severity: "high" },
      { label: "Comparing with a competitor project", severity: "medium" },
      { label: "Wants transparent pricing", severity: "high" },
    ],
    recommendedAction: {
      type: "email",
      description: "Send a detailed cost-sheet with line-by-line breakdown including registration, GST, maintenance corpus, and any other charges. Highlight competitive advantages over the other project.",
      timeframe: "Within 6 hours",
    },
    suggestedResponse: "Hi Meera! You're asking exactly the right question — total ownership cost is what matters, not just the base price. I'm preparing a detailed cost sheet for our Hebbal project that includes registration (5.6%), GST (5% for under-construction), maintenance corpus, and club membership. I'll have it in your inbox by this evening. Would you also like me to arrange a side-by-side comparison with the other project you're considering?",
    timeline: [
      { dayOffset: 0, action: "Send detailed cost sheet", channel: "email", completed: false },
      { dayOffset: 2, action: "Follow up on cost sheet review", channel: "call", completed: false },
      { dayOffset: 5, action: "Arrange comparative site visits", channel: "whatsapp", completed: false },
      { dayOffset: 10, action: "Share festive offers if available", channel: "email", completed: false },
      { dayOffset: 18, action: "Decision follow-up", channel: "call", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
  },

  "lead-004": {
    summary: "Rahul is an IT professional comparing multiple configurations and localities — Sarjapur Road vs Electronic City for a 2 or 3 BHK. He is methodical and data-driven, requesting floor plans, locality infrastructure reports and resale value trends.",
    intent: "comparing_options",
    intentConfidence: 0.80,
    requirements: [
      { label: "2 BHK or 3 BHK apartment", confidence: "explicit" },
      { label: "Sarjapur Road or Electronic City", confidence: "explicit" },
      { label: "Floor plans for all configurations", confidence: "explicit" },
      { label: "Resale value data", confidence: "explicit" },
      { label: "Good IT corridor connectivity", confidence: "inferred" },
    ],
    objections: [
      { label: "Wants data before emotions — won't decide on one visit", severity: "medium" },
      { label: "Concerned about resale value in Electronic City", severity: "medium" },
      { label: "Needs to align with spouse's preferences", severity: "low" },
    ],
    recommendedAction: {
      type: "email",
      description: "Send a comparison pack: floor plans for both configurations, locality infrastructure snapshot, and historical price appreciation data for both areas.",
      timeframe: "Within 1 day",
    },
    suggestedResponse: "Hi Rahul! I love a data-driven approach. I'm putting together a comparison pack for you that includes floor plans (2 BHK and 3 BHK), price-per-sq-ft trends for Sarjapur Road and Electronic City over the last 3 years, and upcoming infrastructure projects (metro, ORR connections). I'll share it tomorrow. It might also help to visit one project in each area — would next weekend work?",
    timeline: [
      { dayOffset: 1, action: "Send comparison pack", channel: "email", completed: false },
      { dayOffset: 3, action: "Check if pack was reviewed", channel: "whatsapp", completed: false },
      { dayOffset: 7, action: "Site visits to both locations", channel: "site_visit", completed: false },
      { dayOffset: 14, action: "Follow up on spouse's feedback", channel: "call", completed: false },
      { dayOffset: 28, action: "Decision check-in", channel: "call", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
  },

  "lead-005": {
    summary: "Kavitha is in the very early stages of property research. She hasn't decided on a locality, budget range or property type. Her message is brief and exploratory — she is gathering general information about the Bengaluru market.",
    intent: "early_research",
    intentConfidence: 0.65,
    requirements: [
      { label: "Residential property", confidence: "inferred" },
      { label: "Bengaluru (locality undecided)", confidence: "explicit" },
    ],
    objections: [
      { label: "No clear timeline or urgency", severity: "low" },
      { label: "May not be financially ready", severity: "medium" },
    ],
    recommendedAction: {
      type: "share_info",
      description: "Send a Bengaluru property buyer's guide (localities, price ranges, checklist) and offer a no-pressure discovery call.",
      timeframe: "Within 2 days",
    },
    suggestedResponse: "Hi Kavitha! Thanks for reaching out. Starting your property search is exciting! I've put together a helpful Bengaluru buyer's guide that covers popular localities, typical price ranges, and a checklist of things to consider. I'll send it over on WhatsApp. Whenever you're ready to narrow down your preferences, I'm happy to hop on a quick call — no pressure at all!",
    timeline: [
      { dayOffset: 1, action: "Send buyer's guide", channel: "whatsapp", completed: false },
      { dayOffset: 7, action: "Light check-in", channel: "whatsapp", completed: false },
      { dayOffset: 21, action: "Share new project launches", channel: "email", completed: false },
      { dayOffset: 45, action: "Re-engagement call", channel: "call", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isSeeded: true,
  },

  "lead-006": {
    summary: "Deepak has submitted a callback request through the website. He mentioned wanting to discuss '4 BHK options in Yelahanka' but did not provide a budget or timeline. The message is very brief and needs qualification.",
    intent: "callback_request",
    intentConfidence: 0.70,
    requirements: [
      { label: "4 BHK", confidence: "explicit" },
      { label: "Yelahanka area", confidence: "explicit" },
    ],
    objections: [
      { label: "No budget disclosed — may have unrealistic expectations", severity: "medium" },
      { label: "Minimal engagement so far", severity: "low" },
    ],
    recommendedAction: {
      type: "call",
      description: "Call back promptly — this is a callback request. Qualify budget, timeline and specific requirements during the call.",
      timeframe: "Within 1 hour",
    },
    suggestedResponse: "Hi Deepak! Thanks for requesting a callback. I'd love to help you explore 4 BHK options in Yelahanka — we have some excellent projects there. I'll give you a call shortly to understand your preferences better. If there's a specific time that works for you, just let me know!",
    timeline: [
      { dayOffset: 0, action: "Callback as requested", channel: "call", completed: false },
      { dayOffset: 1, action: "Send shortlisted options", channel: "whatsapp", completed: false },
      { dayOffset: 3, action: "Arrange site visit", channel: "call", completed: false },
      { dayOffset: 7, action: "Follow up on visit", channel: "whatsapp", completed: false },
    ],
    analyzedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isSeeded: true,
  },
};

// ---------------------------------------------------------------------------
// Lead data
// ---------------------------------------------------------------------------

function makeLead(
  id: string,
  name: string,
  location: string,
  propertyRequirement: string,
  budget: number,
  buyingTimeline: Lead["buyingTimeline"],
  customerMessage: string,
  createdMinutesAgo: number,
): Lead {
  const now = new Date();
  const createdAt = new Date(now.getTime() - createdMinutesAgo * 60 * 1000).toISOString();
  const priority = computePriority({ budget, buyingTimeline, customerMessage, location, propertyRequirement });
  const analysis = seededAnalysis[id] ?? null;

  return {
    id,
    name,
    location,
    propertyRequirement,
    budget,
    buyingTimeline,
    customerMessage,
    createdAt,
    updatedAt: createdAt,
    analysisStatus: analysis ? "complete" : "pending",
    analysis,
    priority,
    copilotMessages: [],
    rehearsalMessages: [],
  };
}

/**
 * Six synthetic Bengaluru leads.
 * Every record is clearly fictional — for demonstration purposes only.
 */
export const SEED_LEADS: Lead[] = [
  // 1. Near-term buyer requesting a property visit
  makeLead(
    "lead-001",
    "Priya Sharma",
    "Whitefield",
    "3 BHK apartment in a gated community, 1400+ sq ft, near good schools",
    1_20_00_000, // ₹1.2 Cr
    "immediate",
    `Hi, I'm looking for a 3 BHK apartment in Whitefield. My kids go to Orchids International and I need something within 3 km of their school. I've already visited two projects — Prestige Lakeside Habitat and Brigade Cornerstone — but I want to compare more options before deciding. My budget is around ₹1.2 crore and I want to move within a month as our current lease is ending. Can you arrange a site visit this weekend? Also, how is the traffic situation on Whitefield Main Road during school hours?`,
    120, // 2 hours ago
  ),

  // 2. Buyer worried about financing
  makeLead(
    "lead-002",
    "Arjun Reddy",
    "Sarjapur Road",
    "2 BHK apartment, under ₹60 lakh, home loan needed",
    55_00_000, // ₹55 L
    "1_to_3_months",
    `I want to buy a 2 BHK flat in Sarjapur Road area. My monthly salary is ₹90,000 and I'm not sure if I can get a home loan for ₹50-55 lakh. I have about ₹8 lakh saved for down payment. Can you tell me which banks you have tie-ups with? What would my EMI be for a 20-year loan? I can buy in 2-3 months if the loan works out.`,
    300, // 5 hours ago
  ),

  // 3. Buyer wanting clarity on total ownership cost
  makeLead(
    "lead-003",
    "Meera Krishnamurthy",
    "Hebbal",
    "3 BHK villa or row house, budget ₹2–2.5 crore all-inclusive",
    2_25_00_000, // ₹2.25 Cr
    "3_to_6_months",
    `I'm interested in a villa or row house in Hebbal. I've been quoted ₹2.1 Cr base price for a project there, but I know the final cost is always much higher. Can you give me a proper breakdown of ALL costs — registration charges, GST, maintenance deposit, club membership, legal fees, everything? I'm comparing this with another project in Devanahalli that quoted ₹1.8 Cr base price. I want to know the true apple-to-apple cost before I decide. My total budget is ₹2.5 Cr and I don't want any surprise charges after booking.`,
    480, // 8 hours ago
  ),

  // 4. Buyer comparing configurations and locations
  makeLead(
    "lead-004",
    "Rahul Mehta",
    "Sarjapur Road",
    "2 BHK or 3 BHK apartment, Sarjapur Road or Electronic City, need floor plans",
    85_00_000, // ₹85 L
    "3_to_6_months",
    `I work at Infosys Electronic City and my wife works in Bellandur. We're torn between Sarjapur Road (closer to her office) and Electronic City (closer to mine). Can you send me floor plans for both 2 BHK and 3 BHK options in both areas? We want to compare sq ft rates, amenities and resale value. Budget is flexible between ₹75 L and ₹95 L. We'll probably take 3-6 months to decide — want to make a data-driven choice. Also interested in knowing upcoming metro connectivity for both areas.`,
    1440, // 1 day ago
  ),

  // 5. Long-term researcher with incomplete requirements
  makeLead(
    "lead-005",
    "Kavitha Nair",
    "Bengaluru",
    "Residential property",
    0, // Not specified
    "beyond_12_months",
    `Just exploring options in Bengaluru. What areas would you recommend for a first-time buyer?`,
    4320, // 3 days ago
  ),

  // 6. Callback request, budget not specified
  makeLead(
    "lead-006",
    "Deepak Gowda",
    "Yelahanka",
    "4 BHK options in Yelahanka",
    0, // Not specified
    "not_specified",
    `Please call me back to discuss 4 BHK options in Yelahanka.`,
    30, // 30 minutes ago
  ),
];
