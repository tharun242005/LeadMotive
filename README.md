# SignalDesk — Real Estate Lead Intelligence

> AI-powered lead prioritisation and sales coaching for Bengaluru real estate.

**SignalDesk** helps real-estate salespeople decide which customer to call first, what that customer actually wants, and exactly what to say — all powered by AI analysis of inbound lead data.

## What It Does

| Feature | Description |
|---------|-------------|
| **Lead Intake** | Capture Name, Location, Property requirement, Budget, Timeline, and customer message |
| **AI Analysis** | Gemini-powered lead summary, intent classification, requirements extraction, objection detection, recommended action, and suggested response |
| **Contextual Coach** | Ask follow-up questions about any lead and get answers grounded in that lead's context |
| **Lead Prioritisation** | Deterministic scoring (0–100) with transparent factor breakdown — Hot / Warm / Cold bands |
| **Objection Rehearsal** | Practice handling customer objections with AI playing the customer role, with coaching feedback |
| **Deal Velocity Timeline** | Visual touchpoint plan tailored to each lead's buying timeline |

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Framer Motion
- **AI Model:** Google Gemini 2.0 Flash (server-side, API key never reaches browser)
- **Storage:** Browser localStorage (versioned, with seed data and demo reset)
- **Deployment:** Vercel (free tier)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Gemini API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/leads/          # AI route handlers (analyze, chat, rehearsal)
│   ├── globals.css         # Design system
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Lead intelligence workspace
├── components/             # React components by feature
│   ├── app-shell/          # Layout, navigation, theme
│   ├── leads/              # Lead list, intake form, detail
│   ├── analysis/           # AI analysis display
│   ├── copilot/            # Contextual chat interface
│   ├── rehearsal/          # Objection rehearsal UI
│   └── ui/                 # Shared primitives
├── lib/                    # Business logic
│   ├── ai/                 # Prompts, client, validation
│   ├── leads/              # Scoring, fixtures
│   ├── storage/            # localStorage service
│   └── utils/              # Formatting (INR, dates, etc.)
├── types/                  # TypeScript domain types
│   ├── lead.ts             # Lead, Analysis, Priority
│   └── ai.ts               # API request/response shapes
docs/                       # Architecture, scoring, AI decisions
tests/                      # Unit and integration tests
```

## Lead Scoring

Leads are scored deterministically on five factors (100 points total):

| Factor | Max Points | What It Measures |
|--------|-----------|-----------------|
| Budget Specificity | 20 | Concrete number vs. vague |
| Buying Timeline | 25 | Immediate → 12+ months |
| Message Quality | 20 | Detail and engagement level |
| Location Clarity | 15 | Recognised Bengaluru locality |
| Requirement Specificity | 20 | BHK, type, amenities mentioned |

**Bands:** Hot (≥70) · Warm (≥40) · Cold (<40)

The score is computed locally, before any AI call. See [docs/LEAD_SCORING.md](docs/LEAD_SCORING.md).

## AI Usage Disclosure

- All AI analysis calls use the Google Gemini API via server-side route handlers.
- The API key is stored in environment variables and never sent to the browser.
- AI-generated content is clearly labelled in the UI.
- Seeded fixture data is marked as example analysis, not live AI output.
- See [docs/AI_USAGE_DISCLOSURE.md](docs/AI_USAGE_DISCLOSURE.md) for full details.

## Important Notes

- **All lead data is synthetic.** No real customer information is used.
- **Bengaluru-focused.** All localities, prices (INR ₹), and terminology are specific to Bengaluru, Karnataka.
- **Browser-local storage.** Leads are stored in your browser's localStorage and are not shared across devices.
- **Free-tier resources only.** Gemini API free tier, Vercel free tier.

---

Built for the Masal AI FDE Assignment (Round 2).
