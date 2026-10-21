# SignalDesk — AI Usage & Tooling Disclosure

In accordance with academic and engineering integrity standards, this document discloses:
1. The AI development tools utilized by the engineer during the construction of SignalDesk.
2. The product-level AI models embedded in SignalDesk's runtime architecture.
3. The division of labor between AI assistance and human engineering verification.

---

## 1. Development-Time AI Tooling

During the development of SignalDesk, the engineer utilized the following AI coding assistants:

| Tool | Model / Version | Role & Tasks Assisted |
|---|---|---|
| **Google Antigravity IDE Agent** | Advanced Agentic Coding / Gemini 2.5 Pro & Claude 3.7 Sonnet | - Architecture scaffolding and directory structure organization.<br>- Migration from legacy property-listing code to SignalDesk.<br>- Generating TypeScript interface definitions (`Lead`, `AnalysisResponse`, `MomentumPlan`, `RehearsalResponse`).<br>- Writing unit test suites for scoring, schema contracts, coaching, rehearsal, and security.<br>- Drafting Tailwind CSS v4 styling tokens and Framer Motion micro-interactions.<br>- Formulating prompt templates for Gemini 3.8 Flash (`buildAnalysisPrompt`, `buildChatPrompt`, `buildRehearsalPrompt`). |

### Human Engineering Governance & Verification
While AI coding agents generated initial drafts of code, schemas, and tests, the candidate performed critical engineering oversight:
- **Architectural Constraints**: Designed the 0ms deterministic 4-factor scoring rubric, intentionally rejecting pure LLM scoring to eliminate non-deterministic drift and latency.
- **Safety Boundaries**: Enforced triple-quote prompt-injection shielding, verbatim quotation verification, and non-conversion-probability disclaimers.
- **Runtime Validation**: Independently executed and validated all test suites (`npm test`), type checking (`npx tsc --noEmit`), linting (`npm run lint`), and production Next.js compilation (`npm run build`).
- **Debugging & Path Resolution**: Diagnosed and resolved Node.js native test runner `@/` alias resolution issues by properly scoping fallback logic into `src/lib/ai/prompts.ts`.

---

## 2. Product-Level AI Runtime Integration

SignalDesk incorporates artificial intelligence as an operational feature within its production architecture:

### A. Integrated Model
- **Provider**: Google Gemini Developer API.
- **Model**: `gemini-3.8-flash` (Flash-class low-latency text model).
- **SDK**: Official `@google/genai` (v2.30.0).
- **Environment Variable**: `GEMINI_API_KEY` (server-side only, zero client exposure).

### B. Product AI Use Cases
1. **Lead Analysis & Extraction (`/api/leads/analyze`)**:
   - Synthesizes unstructured customer inquiries into structured JSON.
   - Extracts customer intent, functional requirements, and underlying objections.
   - Identifies and verifies verbatim quotation evidence.
   - Formulates recommended next actions and WhatsApp response drafts.
2. **Contextual AI Sales Coach (`/api/leads/chat`)**:
   - Acts as an interactive sales co-pilot grounded strictly in the selected lead's data.
   - Answers rep questions (call openers, priority rationale, financing objections).
   - Generates suggested follow-up chips and highlights unverified details.
3. **Objection Rehearsal Studio (`/api/leads/rehearsal`)**:
   - **Roleplay Mode**: Simulates the prospective buyer voice with realistic hesitation.
   - **Coach Mode**: Evaluates sales conversation technique against a 4-dimension 1–5 rubric with an explicit non-prediction disclaimer.
4. **Lead Momentum Plan (`/api/leads/plan`)**:
   - Generates dynamic 3–10 step sequential action roadmaps with pre-flight fact-check chips and decision branches.

---

## 3. Product-Level Guardrails & Transparency

1. **Pre-Seeded Demo Attribution**:
   - Seeded demo leads are explicitly labeled: *"Example analysis — pre-generated for demo preview, not from a live AI call."*
2. **Telemetry Attribution**:
   - Every AI response contains an `AIMetadata` header indicating whether the response was served via `live` Gemini API or the `offline-heuristic` fallback engine.
3. **Non-Prediction Disclaimer**:
   - All priority scores and coaching debriefs explicitly state they are educational qualification tools, not statistically guaranteed conversion probabilities.
4. **Verbatim Quotation Grounding**:
   - Extracted quotes must exist as exact substrings of the raw customer message; otherwise, they are marked `[Unverified Quote]`.
