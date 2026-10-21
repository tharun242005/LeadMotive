# SignalDesk — Authoritative Lead Prioritisation & Scoring Methodology

## 1. Why Deterministic Scoring?

A core design decision in SignalDesk is separating **Quantitative Priority Scoring** from **Qualitative AI Enrichment**.

In high-stakes real estate sales, pure LLM-based scoring suffers from three critical flaws:
1. **Non-deterministic drift**: The same lead scored at 9:00 AM might score 82 and at 2:00 PM score 71 due to model temperature and context shifts.
2. **Latency penalty**: Calculating a queue of 20 leads via LLM API calls introduces 3–8 seconds of blocking latency.
3. **Unexplainability to non-technical buyers**: When a VP of Sales asks *"Why is this buyer ranked above that buyer?"*, saying *"Because the neural net thought so"* destroys trust.

SignalDesk solves this by calculating a **100-point deterministic score** instantaneously in the client upon intake. The AI model then enriches the lead with contextual analysis, intent classification, objection handling, and response drafts.

> **CRITICAL NOTE**: The score is an explainable, rule-based prioritization aid. It is **NOT** a statistically calibrated probability of conversion.

---

## 2. The Single Authoritative 4-Factor Formula (Prompt 3.1)

The total score is divided across four weighted factors totaling 100 points:

| Factor | Weight | Maximum Points | Core Indicator |
| :--- | :--- | :--- | :--- |
| **Buying Timeline** | 30% | **30 pts** | Closing urgency & purchasing horizon (30, 22, 14, 7, 0) |
| **Explicit Buying Intent** | 30% | **30 pts** | Transaction/visit signals vs research (30, 20, 12, 6, 0) |
| **Requirement Completeness** | 25% | **25 pts** | Location, typology, budget, timeline, constraints (5 x 5) |
| **Engagement Depth** | 15% | **15 pts** | Conversation depth / message substance (15, 10, 4, 0) |
| **Total** | 100% | **100 pts** | **Aggregated Deterministic Priority Score** |

---

## 3. Detailed Factor Scoring Rules

### A. Buying Timeline (Max 30 pts)
Sales velocity depends on closing proximity:
- **Within 30 days (`immediate`)**: **30 pts** (Critical action window)
- **Within 90 days (`1_to_3_months`)**: **22 pts** (Active purchasing evaluation)
- **Within 180 days (`3_to_6_months`)**: **14 pts** (Mid-term decision horizon)
- **Beyond 180 days (`6_to_12_months` or `beyond_12_months`)**: **7 pts** (Extended planning / exploratory)
- **Unknown (`not_specified`)**: **0 pts** (Requires qualification)

### B. Explicit Buying Intent (Max 30 pts)
Evaluates financial backing paired with explicit purchase intent:
- **Explicit visit or decision/next-step request**: **30 pts**
  - Signals: *site visit*, *visit this weekend*, *ready to buy*, *ready to close*, *sanctioned*, *pre-approved*, *token amount*, *advance*, *finalize*, *all cash*, *cheque ready*.
- **Specific pricing, availability, financing or total-cost question**: **20 pts**
  - Signals: *pricing per sqft*, *total ownership cost*, *maintenance charges*, *home loan eligibility*, *bank tie-ups*, *possession date*, *Cauvery connection*.
- **Explicit comparison between options**: **12 pts**
  - Signals: *comparing two projects*, *shortlisted*, *evaluating options*, *competitor comparison*.
- **Broad initial research**: **6 pts**
  - Signals: *looking for information*, *exploring market*, *callback request*, *call me*.
- **Unclear buying intent**: **0 pts**

### C. Requirement Completeness (Max 25 pts)
Evaluates whether the buyer has provided concrete, qualifying criteria (5 points each):
1. **Known Location**: **5 pts** (Recognized Bengaluru locality or corridor)
2. **Clear Property Requirement**: **5 pts** (Concrete typology: 2 BHK, 3 BHK, Villa, Penthouse)
3. **Known Budget**: **5 pts** (Stated numerical budget > 0)
4. **Known Buying Timeline**: **5 pts** (Stated timeframe !== `not_specified`)
5. **Concrete Customer Need or Constraint**: **5 pts** (Identified school proximity, Vaastu compliance, high floor, car parking, RERA, or A-Khata requirements)

### D. Engagement Depth (Max 15 pts)
Evaluates communicative substance based strictly on conversation depth (avoiding double-counting visit requests):
- **Three or more meaningful customer turns in conversation**: **15 pts**
- **Two meaningful customer turns in conversation**: **10 pts**
- **One substantive initial message (≥ 20 characters)**: **4 pts**
- **No usable message**: **0 pts**

---

## 4. Priority Bands

- **🔥 Hot Lead (Score 75–100)**: Immediate action window, strong financial commitment, concrete criteria. Target response time: **< 15 minutes**.
- **⚡ Warm Lead (Score 45–74)**: Qualified buyer in active evaluation phase. Target response time: **< 2 hours**.
- **❄️ Cold Lead (Score 0–44)**: Vague inquiry, distant exploratory timeline, or uncommitted budget. Enrolled in automated nurture drip.

---

## 5. UI Transparency ("Why this score?")

SignalDesk displays an interactive breakdown modal for every lead in both the homepage preview and the `/workspace` application:
- Visual progress bars for all 4 dimensions.
- Mathematical point contribution (e.g. `30/30 pts`, `25/25 pts`).
- Explicit audit trail detailing the exact reasons points were awarded or withheld.
- Re-evaluated in 0ms on lead edits without network latency.
