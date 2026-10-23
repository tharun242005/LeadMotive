# LeadMotive — AI-Powered Real Estate Lead Intelligence

**Know which buyer to move next. Know what to say.**

LeadMotive is a real-estate sales intelligence application that helps a salesperson understand inbound property enquiries, prioritise leads with an explainable rules-based score, practise difficult buyer conversations, and organise lead-specific follow-up actions.

<p align="left">
  <a href="https://iqol-six.vercel.app/"><strong>Live application</strong></a> ·
  <a href="https://iqol-six.vercel.app/workspace"><strong>Open workspace</strong></a> ·
  <a href="https://github.com/tharun242005/LeadMotive"><strong>Source repository</strong></a>
</p>

> **Demo-data and privacy notice:** The included lead examples are synthetic. The current application stores leads and plan progress in browser `localStorage`; it does not provide a shared, server-side customer database. Do not enter real customer personal, financial, or otherwise sensitive information into a demo deployment. Model-generated property details, availability, prices, legal information, financial estimates, and possession dates must be independently verified before being communicated to a customer.

## Features

### AI-assisted lead analysis

Submit a lead's name, location, property requirement, budget, buying timeline, and customer message. The analysis workflow can produce:

- A concise lead summary and buying-intent assessment.
- A structured view of property needs and constraints.
- Potential objections and customer evidence quotes, with quote-grounding checks.
- Missing information and details that need verification.
- A recommended next action and a suggested customer response.

The language model assists with interpretation and drafting. Its output is not a source of verified property inventory or professional legal, lending, tax, or investment advice.

### Explainable lead prioritisation

LeadMotive calculates a deterministic score locally from four factors. The score is a qualification heuristic, **not a probability that a lead will convert**.

| Factor | Maximum | Main rule |
|---|---:|---|
| Buying timeline | 30 | Earlier stated buying timelines receive more points. |
| Explicit buying intent | 30 | Concrete actions such as a viewing request receive more points than broad research. |
| Requirement completeness | 25 | Five points each for meaningful location, property requirement, budget, timeline, and a concrete need or constraint. |
| Engagement depth | 15 | Points depend on the number of meaningful conversation turns and whether the initial message is substantive. |
| **Total** | **100** | Sum of the four factors. |

Priority bands are consistent across the interface:

- **Act Now:** 75–100
- **Follow Up:** 45–74
- **Nurture:** 0–44

The score breakdown is visible to the salesperson. Priority labels guide attention; they do not guarantee customer behaviour or sales outcomes.

### Contextual AI Coach

The Coach answers questions in the context of the currently selected lead, such as preparing a call opener or planning how to discuss a documented concern. Lead context is scoped to the active workflow; the Coach should not be treated as a source of unverified property facts.

### Objection Rehearsal

The salesperson can practise a buyer conversation, including **Immediate Buyer Practice** and **Documented Concern** scenarios, where available in the current interface. The rehearsal workflow supports roleplay and a coaching debrief across four dimensions:

- Empathy and rapport
- Objection addressing
- Value proposition
- Call-to-action clarity

The scorecard is educational feedback, not a prediction of conversion.

### Lead Momentum Plan

The plan studio generates a lead-specific sequence of follow-up actions (between 3 and 10 steps, subject to the plan workflow), with relevant timing, customer-response drafts, progress tracking, and adaptation support. Message drafts are for salesperson review and copying; LeadMotive does not automatically contact customers.

### Day and Night themes

- **Day Mode — Terracotta Editorial:** warm ivory surfaces, charcoal navigation, and restrained terracotta accents.
- **Night Mode — Midnight Tech:** deep navy surfaces, crisp text, and electric-cyan accents.

Priority colours are separate from the general theme accent: red for Act Now, amber/orange for Follow Up, and blue for Nurture.

## Application routes

| Route | Purpose |
|---|---|
| `/` | Public product homepage and synthetic interactive preview. |
| `/workspace` | Lead queue, intake, analysis, score explanation, AI Coach, and rehearsal entry points. |
| `/workspace/momentum` | Lead Momentum Plan workspace. |
| `GET /api/leads/diagnostics` | Reports AI-provider configuration and diagnostics status without returning secrets. |
| `POST /api/leads/analyze` | Validates a lead-analysis request and returns structured analysis. |
| `POST /api/leads/chat` | Handles lead-contextual Coach requests. |
| `POST /api/leads/rehearsal` | Handles buyer roleplay and coaching requests. |
| `POST /api/leads/plan` | Generates or adapts a Momentum Plan. |

The exact request and response contracts are defined in the source and runtime schemas; consult those when integrating with the API. Successful HTTP status alone does not prove that an external model responded—check response metadata for the actual provider and mode.

## Architecture

```text
Browser (Next.js / React UI)
  ├── Lead queue, intake, selected-lead analysis
  ├── Local deterministic scoring and priority display
  ├── Browser localStorage for leads and supported saved workflows
  └── Requests to same-origin Next.js API routes
          │
          ▼
Next.js server-side API handlers
  ├── Request validation and prompt construction
  ├── Gemini primary provider (when configured and available)
  ├── Optional Groq secondary provider (when configured and available)
  ├── Shared response validation and factual-grounding checks
  ├── Bounded retry / timeout / rate-limit handling
  └── Clearly labelled deterministic offline heuristic fallback
          │
          ├── Google Gemini API
          └── Groq API (optional)
```

All provider calls should be made server-side. API credentials belong in server environment variables, never in client-side code or variables prefixed with `NEXT_PUBLIC_`.

### AI provider configuration

- **Primary provider:** Google Gemini using the official `@google/genai` SDK.
- **Primary model default:** `gemini-3.5-flash-lite`.
- **Optional secondary provider:** Groq, using the official OpenAI-compatible Chat Completions API.
- **Secondary model default:** `openai/gpt-oss-20b`.
- **Last fallback:** deterministic local heuristics.

The intended request order is Gemini → Groq (if configured and available) → offline heuristics. Provider quotas, credentials, service availability, and plan limits can affect which provider serves a request. There is no guarantee of uninterrupted or unlimited free service. The UI/API should identify whether the result came from Gemini, Groq, or offline heuristics; never describe heuristic output as live AI.

The model identifiers above are project defaults, not a guarantee that a model is available to every account or remains available indefinitely. Check the providers' current model documentation and the project's actual diagnostics when troubleshooting.

- [Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini API keys](https://aistudio.google.com/app/apikey)
- [Groq model documentation](https://console.groq.com/docs/models)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)

## Tech stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS v4
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Primary AI SDK:** `@google/genai`
- **Data persistence:** browser `localStorage` for the current single-browser evaluation/demo workflow
- **Validation and safety:** application-level request/response validation, prompt-injection mitigations, quote grounding, provider provenance, and fallbacks
- **Hosting:** Vercel

Use `package.json` and `package-lock.json` as the authoritative source for the exact installed dependency versions.

## Run locally

### Prerequisites

- A supported Node.js LTS version compatible with the installed Next.js version.
- npm.
- Optional API keys for live AI functionality.

### 1. Clone the repository

```bash
git clone https://github.com/tharun242005/LeadMotive.git
cd LeadMotive
npm install
```

### 2. Configure environment variables

Create a local environment file by copying the example:

**PowerShell (Windows):**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux:**

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your own values:

```env
# Primary provider — Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional secondary provider — Groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

You can use Gemini without a Groq key. If neither external provider is configured or available, the application may use its explicitly labelled offline heuristic fallback.

**Security:** Never commit `.env.local`, paste keys into issue reports, or use `NEXT_PUBLIC_` names for provider credentials. If a key is exposed, revoke it with the provider and create a replacement. Free-tier provider terms may govern how submitted prompts and outputs are processed; use synthetic data for evaluation.

### 3. Start the development server

```bash
npm run dev
```

Open:

- Homepage: <http://localhost:3000>
- Workspace: <http://localhost:3000/workspace>

If port 3000 is already in use, stop the existing development server or select another port rather than terminating an unidentified process.

### 4. Run the production build locally

```bash
npm run build
npm run start
```

If port 3000 is occupied, use a different port, for example:

```bash
npx next start -p 3001
```

Then open <http://localhost:3001>.

## Tests and quality checks

Run the project checks from the repository root:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

The `npm test` script invokes the scoring, plan, analysis, chat, rehearsal, security/resilience, provider-reliability, API endpoint, and real-estate scenario test files configured in `package.json`. Test counts can change as tests are updated; use the actual command output when reporting the current result.

Some provider failure scenarios should use mocked responses so tests do not exhaust free API quota. Run only a small number of genuine provider smoke tests when credentials and quota permit, and distinguish live-provider tests from mocked failover tests.

## Deployment on Vercel

The current public deployment is:

- [https://iqol-six.vercel.app](https://iqol-six.vercel.app)

The repository is public at:

- [https://github.com/tharun242005/LeadMotive](https://github.com/tharun242005/LeadMotive)

To deploy from the local project using the Vercel CLI:

```bash
npx vercel
```

Use the preview deployment to check changes. When verified, deploy the current local source to production:

```bash
npx vercel --prod
```

Alternatively, connect the GitHub repository to the existing Vercel project to enable Git-based deployments according to the project's Vercel settings.

### Configure production environment variables

In Vercel, open the project settings and add the same variable names (`GEMINI_API_KEY`, `GEMINI_MODEL`, `GROQ_API_KEY`, and `GROQ_MODEL`) to the appropriate server environment, especially **Production**. API keys must be stored as secrets. Local `.env.local` values are not automatically uploaded to Vercel. After changing environment variables, create a new deployment.

After deployment, test the public URL in a fresh browser session. Verify lead analysis, Coach, Practice, Momentum Plan, theme switching, provider metadata, and the failure/fallback states. A successful local build does not by itself prove that production environment variables or live AI provider calls are working.

## Data, limitations, and responsible use

- **Browser-local persistence:** Leads and supported plan state are stored in the current browser's `localStorage`. This is suitable for a single-user evaluation/demo but does not provide multi-user synchronisation, central backup, or server-side access control. Clearing browser data may remove records.
- **Synthetic data:** The included Bengaluru-style examples are fictional demonstrations. They are not evidence of actual listings, prices, schools, travel times, legal status, or availability.
- **Model output:** AI-generated text can be incomplete or inaccurate. Verify inventory, locality details, prices, possession dates, financing calculations, RERA status, title/khata details, and other material claims from authoritative sources before using them with a customer.
- **Prioritisation:** The lead score is a deterministic, explainable rubric. It is not trained on historical conversion outcomes and is not a statistical conversion probability.
- **Provider availability:** Gemini and Groq have independent quotas, availability, and terms. When both are unavailable, the offline heuristic may provide limited functionality; it is not equivalent to an LLM response.
- **Privacy:** Do not use real customer personal or sensitive data in public/free-tier demonstrations. Review each provider's current terms and privacy documentation before processing any non-synthetic data.
- **No automatic outreach:** Customer-facing message drafts are intended for human review. The app does not promise that messages are sent to customers automatically.

## Project documentation

The `docs/` directory contains additional implementation and evaluation material, including:

- `ARCHITECTURE.md` — architecture and data flow.
- `LEAD_SCORING.md` — scoring specification.
- `AI_DECISIONS.md` — AI integration and design decisions.
- `TEST_PLAN.md` — test plan.
- `DEMO_SCRIPT.md` — demonstration walkthrough.
- `AI_USAGE_DISCLOSURE.md` — AI and development-tool disclosure.
- `RELEASE_AUDIT.md` and release-readiness reports — implementation and QA records.

Refer to the actual test output and current code if a report and implementation appear inconsistent.

## Acknowledgements

Built by **Tharun P** for the LeadMotive project.

- Email: [run40081@gmail.com](mailto:run40081@gmail.com)
- GitHub: [tharun242005](https://github.com/tharun242005)
- Project repository: [LeadMotive](https://github.com/tharun242005/LeadMotive)
- Live application: [iqol-six.vercel.app](https://iqol-six.vercel.app)

---

*LeadMotive is a demonstration and decision-support project. It is not a source of verified property inventory, legal advice, lending approval, or guaranteed investment or sales outcomes.*
