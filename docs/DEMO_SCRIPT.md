# SignalDesk — 3-Minute Demonstration Video Script

**Target Duration:** Exactly 3 Minutes (180 Seconds)  
**Role:** Candidate / Forward-Deployed Engineer  
**Screen Recording Target:** Full Screen (1080p, Light or Dark Mode)  
**Audio:** Crisp Voiceover with live microphone  

---

## Script Sequence & Timing

### [0:00 – 0:20] SignalDesk Overview & Lead Queue
**Visual:** Open browser at `http://localhost:3000/workspace` (or deployed URL). Show the 3-pane workbench and 6 ranked Bengaluru leads.

> *"Welcome to SignalDesk, an AI lead intelligence workbench built for high-velocity real estate markets like Bengaluru. 
> Real-estate sales reps face a critical triage problem: dozens of incoming inquiries, but no instant clarity on who to call first.
> Here in the lead queue, all incoming leads are prioritized immediately: from Priya Sharma in Whitefield marked Hot with 89 points, to Arjun Reddy marked Warm, down to exploratory buyers marked Cold."*

---

### [0:20 – 0:45] Add a New Synthetic Bengaluru Lead
**Visual:** Click `+ New Lead Intake`. The modal opens. Type or paste the new lead details.

> *"Let’s intake a new prospect.
> - Name: **Kavita Sundaram**
> - Location: **Indiranagar, Bengaluru**
> - Typology: **3 BHK Penthouse**
> - Budget: **₹3.5 Crore**
> - Timeline: **Within 30 Days (Immediate)**
> - Customer Message: 'Relocating from Singapore by month-end. Need a 3 BHK near 100 Feet Road with clear A-Khata and 2 car parkings. Is possession guaranteed before December? Can visit this Saturday.'
> Now, click **Analyze & Prioritize Lead**."*

---

### [0:45 – 1:20] Real Server AI Analysis & Scannable Findings
**Visual:** Analysis triggers via server-side Gemini 3.8 Flash. The card populates with verified badges.

> *"In under a second, our server-side Gemini 3.8 Flash model synthesizes the raw message:
> - **Summary**: Relocating buyer with high urgency and specific parking and A-Khata requirements.
> - **Intent**: Classified as High Readiness with 95% confidence.
> - **Requirements**: Extracted Indiranagar corridor, 3 BHK typology, ₹3.5 Cr budget.
> - **Underlying Objections**: Identifies possession timeline anxiety, linked directly to the verbatim customer quote: 'Is possession guaranteed before December?' Notice the green Grounded badge—the quote is verified against raw text.
> - **Action & WhatsApp Draft**: Generates an immediate Saturday visit recommendation and a copy-ready response draft addressing her Singapore relocation."*

---

### [1:20 – 1:45] Explain the Transparent 4-Factor Scoring Formula
**Visual:** Click **View Breakdown** or the priority score badge (89/100). Show the 4 progress meters.

> *"Notice Kavita scored 89 out of 100, placing her in the Hot band. 
> Unlike opaque AI tools, this score is 100% deterministic, calculated in 0 milliseconds using our 4-factor rubric:
> - **Timeline (30 pts)**: Immediate purchase gives maximum 30 points.
> - **Buying Intent (30 pts)**: Explicit Saturday visit request awards full 30 points.
> - **Completeness (25 pts)**: All 5 criteria—budget, location, typology, timeline, constraint—are present (25 pts).
> - **Depth (15 pts)**: Substantive inquiry gives 4 points.
> The score is a predictable triage aid, not a statistical conversion probability."*

---

### [1:45 – 2:15] Ask Contextual AI Coach Follow-Up Question
**Visual:** In the right pane, click the prompt chip: *"Give me a 30-second call opener"*. Show the generated spoken script.

> *"Before calling Kavita, the salesperson consults our Contextual AI Coach.
> We click 'Give me a 30-second call opener'.
> The coach generates an articulate telephone script acknowledging her Singapore move, confirming the Indiranagar project's A-Khata status, and offering two Saturday appointment slots.
> When we switch to Arjun Reddy, notice the conversation resets completely. Cross-lead context is strictly isolated."*

---

### [2:15 – 2:45] Objection Rehearsal & Coaching Debrief
**Visual:** Select Arjun Reddy. Click **Practise this conversation**. Roleplay a message, then click **Request Coaching Debrief**.

> *"Now, our signature feature: **Objection Rehearsal Studio**.
> Real estate reps often hesitate when buyers push back on price or EMIs. 
> Here, Gemini simulates Arjun Reddy's voice: '₹1.4 Cr is stretching my budget with interest rates at 8.75%.'
> We reply with a pre-EMI subsidy offer and click **Request Coaching Debrief**.
> The AI transitions into a sales coach, evaluating us across a 4-dimension 1–5 rubric: Empathy, Objection Handling, Value Proposition, and CTA Clarity, complete with an educational non-prediction disclaimer."*

---

### [2:45 – 3:00] Core Engineering Decisions & Limitations
**Visual:** Show the AI Diagnostics modal with `gemini-3.8-flash` telemetry, then return to workspace.

> *"Under the hood:
> - Zero client-side secrets: all AI requests execute via server-side Next.js route handlers.
> - 43 automated unit tests verify schema bounds, scoring contracts, and context isolation.
> - Resilient offline fallback ensures the app never crashes during outages.
> - Browser-local storage keeps the demo self-contained without database setup.
> SignalDesk transforms raw inquiries into confident, prioritized sales action. Thank you!"*

---

## Recording Checklist for Candidate

- [ ] Ensure local dev server (`npm run dev`) or deployed URL is open in Google Chrome.
- [ ] Screen resolution set to 1920×1080 (1080p) or 1440×900.
- [ ] Browser zoom at 100%.
- [ ] DevTools closed.
- [ ] Pre-copy Kavita's sample text to clipboard for quick paste.
- [ ] Test audio input levels (no background noise).
- [ ] Keep recording under 3:00.
