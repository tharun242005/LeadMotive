# SignalDesk — 3-Minute Demo & 30-Minute Interview Guide

This guide is designed for the 3-minute product demo and 30-minute technical interview walkthrough for the **Masal AI — Forward Deployed Engineer (Round 2)** assignment.

---

## Part 1: The 3-Minute Demo Pitch

### [0:00 – 0:30] The Hook & Problem Statement
> *"Hello! I’m presenting **SignalDesk**, an AI lead intelligence workbench built specifically for real-estate sales teams in high-velocity markets like Bengaluru. 
> 
> Real-estate sales reps face a classic daily crisis: they receive dozens of inbound inquiries, but 70% of their time is wasted figuring out who to call first, deciphering vague customer messages, and dialing into calls unprepared for hard price objections. SignalDesk solves this in three steps: **Instant Mathematical Prioritisation**, **AI Intent & Objection Extraction**, and our signature feature, **Objection Rehearsal**."*

### [0:30 – 1:15] Prioritisation & Transparent Scoring
> *(Action: Open SignalDesk at `http://localhost:3000`)*
> 
> *"Here on the left is our Lead Queue. Notice that every lead has an instant 0–100 score and a clear band: Hot, Warm, or Cold.
> 
> Unlike apps that rely on slow, unpredictable LLM calls to rank leads, our base score is **100% deterministic and calculated instantaneously on the client**. If I click on Vikram Nair and click **'Why this score?'**, you see the exact breakdown: Timeline, Budget specificity, Message depth, Bengaluru locality, and Requirements. Sales reps understand the math immediately—there's no black-box mystery."*

### [1:15 – 2:00] Deep AI Lead Analysis
> *(Action: Show the Lead Detail workspace for Vikram)*
> 
> *"On the right workspace, our Gemini 2.0 Flash engine analyzes the customer's raw message to give the salesperson instant superpowers:
> 1. **Extracted Requirements & Severity-coded Objections**: Notice it detected his concern about ₹11,500/sqft pricing and possession risk.
> 2. **Deal Velocity Timeline**: It maps out touchpoints across his 1–3 month horizon.
> 3. **One-Click Smart Responses**: Ready-to-send WhatsApp drafts tailored to Bengaluru property expectations, ready with one-click copy."*

### [2:00 – 2:45] The Signature Feature: Objection Rehearsal
> *(Action: Click 'Practise' in top actions or NavRail)*
> 
> *"Now for the feature I invented for this assignment: **Objection Rehearsal**. 
> 
> Summaries are good, but sales deals are won or lost on live calls. Before dialing Vikram, the sales rep can do a 60-second sparring session. The AI steps into Vikram's shoes, raising his exact objections about pricing and delays.
> 
> Watch what happens when I respond: 'Our carpet area efficiency gives 8% more usable space.' The AI customer responds in character, but our AI Coach simultaneously grades my pitch, gives me a score out of 10, highlights what I did well, and shows me an improved alternative response."*

### [2:45 – 3:00] Closing & Resilience
> *"Finally, SignalDesk is built for enterprise stability. Notice the AI Settings modal in the NavRail: it runs live with Google Gemini 2.0 Flash, but includes a zero-dependency heuristic fallback engine so it never goes down during live customer demos. Thank you!"*

---

## Part 2: 30-Minute Technical Interview Deep Dive

### 1. "Why did you choose localStorage instead of a database like PostgreSQL or Supabase?"
- **Answer**: 
  1. *Assignment alignment*: The prompt explicitly stated *"in-memory or real DB, your call."*
  2. *Zero-failure demo surface*: External database connection strings, pooling limits, and migration scripts introduce points of failure during quick reviewer evaluation.
  3. *Client-side privacy & velocity*: Versioned `localStorage` (`signaldesk_leads_v1`) provides 0ms read/write latency, seamless offline testing, and instant demo reset (`resetToSeedData()`) without database seeds.

### 2. "Why deterministic scoring instead of letting the LLM score the lead?"
- **Answer**:
  1. *Consistency*: An LLM will score the same lead differently based on temperature or prompt wording drift.
  2. *Speed*: Calculating scores on 50 leads via LLM takes 10+ seconds. Deterministic scoring takes < 1 millisecond.
  3. *Explainability*: In enterprise software, sales leaders need an auditable formula they can tweak. We let math do what math is good at (numbers & weights), and let LLMs do what LLMs are good at (qualitative synthesis & conversation).

### 3. "What happens if Gemini API experiences rate limits or goes down?"
- **Answer**:
  - We engineered a **multi-tiered resilience strategy** in `src/lib/ai/client.ts`:
    1. Primary model: `gemini-2.0-flash`.
    2. Model fallback: If 404 or 429 occurs, retries once on `gemini-1.5-flash`.
    3. Heuristic Fallback Engine: If no API key is present or all cloud calls fail, the server falls back to our internal heuristic engine that generates realistic Bengaluru-grounded assessments so the user is never stranded with a 500 error.

### 4. "How did you prevent the LLM from hallucinating or breaking the UI?"
- **Answer**:
  - We use Gemini's native `responseMimeType: "application/json"`.
  - On the server, we run every response through our runtime schema validator in `src/lib/ai/schemas.ts`. If fields are malformed or missing, they are sanitized or defaulted before reaching the frontend.
  - We strip Markdown code fences (` ```json `) to prevent JSON parse errors.

### 5. "How would you scale this to 100,000 leads and voice systems (like Masal AI's voice products)?"
- **Answer**:
  1. **Storage & Queueing**: Transition to PostgreSQL + pgvector with Redis/BullMQ background worker queues to process inbound webhooks asynchronously.
  2. **Voice Agent Integration**: The `Deal Velocity Timeline` and `Objection Rehearsal` prompt representations map directly to phone prompts for AI voice agents (like Masal AI). The extracted objections become the voice agent's dynamic guardrails during inbound qualification calls.
