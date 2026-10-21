# SignalDesk — Signature Feature: Objection Rehearsal Mode

> **Assignment Requirement**: *"One required feature is entirely up to you to invent, and we'll dig into your decisions together in a 30-minute interview."*

---

## 1. The Core Insight: Why We Built Objection Rehearsal

Most AI real-estate tools stop at **passive summarization**: they show a lead score, generate an email draft, and leave the sales rep to make the call.

In reality, the biggest drop-off in the sales funnel happens **during the live phone conversation**:
- A buyer says: *"Your quote of ₹11,500/sqft is too high. The builder down the road is offering ₹9,200."*
- Or: *"What if possession gets delayed like other projects in Whitefield?"*
- Junior or unprepared salespeople panic, make unauthorized price concessions, or fail to reframe the value.

**Objection Rehearsal** turns SignalDesk from an analytical dashboard into an **interactive flight simulator** for sales reps.

Before picking up the phone, the rep can spend 90 seconds doing a live practice run where:
1. **The AI roleplays as the specific buyer**, staying in character with their exact budget, timeline, and extracted objections.
2. **The salesperson practices their pitch** in real-time.
3. **The AI provides instant coaching feedback**: an objective score (1–10), specific strengths, missed opportunities, and an improved alternative response.

---

## 2. How It Works Technically

```
┌─────────────────────────────────────────────────────────────┐
│                       LEAD CONTEXT                          │
│  Name: Vikram Nair                                          │
│  Location: Whitefield | Budget: ₹1.65 Cr                    │
│  Detected Objection: "Price per sqft too high vs. corridor" │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 REHEARSAL STATE MACHINE                     │
│                                                             │
│  1. Rep sends opening:                                      │
│     "Hi Vikram, our carpet efficiency gives 8% more space." │
│                                                             │
│  2. AI Customer Reply (in-character):                       │
│     "Okay, but what about the construction timeline?        │
│      Can you guarantee the handover date with penalty?"     │
│                                                             │
│  3. AI Coach Feedback (evaluation loop):                    │
│     - Score: 7/10                                           │
│     - Strengths: Grounded with concrete carpet metrics      │
│     - Improvements: Acknowledge price before counter-arguing│
│     - Suggested Alternative: "I understand price is top..." │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Product & Business Value

1. **Ramps New Hires 3x Faster**: New sales reps can practice 20 simulated calls before speaking to a real high-net-worth buyer.
2. **Protects Developer Margin**: Helps reps defend price per sqft and carpet area value instead of caving on discounts.
3. **Grounded in Actual Lead Objections**: The roleplay is not a generic generic chatbot — it dynamically loads the objections extracted from the lead's intake message (e.g. *Cauvery water*, *A-Khata*, *Metro delay*).
4. **Low Pressure, High Confidence**: Salespeople can experiment with bolder closing questions without risking real customer relationships.

---

## 4. Evaluation Criteria & Interview Talking Points

During the interview, be prepared to demonstrate:
- **Tone Adjustment**: How the AI customer stays realistic without being impossible to close.
- **Feedback Quality**: How the coaching feedback rewards empathy, metrics, and closing questions.
- **Latency**: How the 2-in-1 prompt returns both the customer's dialogue and the coaching evaluation in a single round-trip to keep conversation fluid.
