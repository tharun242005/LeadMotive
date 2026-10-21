# IQOL — Workflow & Statuses

> **Phase 1 deliverable** — Status transitions, workflow rules and business logic
> Created: 2026-10-20 · References: [DATA_DICTIONARY.md](file:///c:/Users/run40/Downloads/IQOL/docs/DATA_DICTIONARY.md), [PRODUCT_SPEC.md](file:///c:/Users/run40/Downloads/IQOL/docs/PRODUCT_SPEC.md)

---

## 1. Design Principle: Separated Status Fields

Four independent status fields track different concerns. They must NEVER be merged into a single field.

| Status field | Entity | Tracks |
|---|---|---|
| `inquiry_status` | Inquiry | Lead qualification progress |
| `email_status` | Inquiry | Email delivery outcome |
| `chat_session_status` | Inquiry | Token/session validity |
| `booking_status` | Booking | Site-visit booking lifecycle |

### Independence rules

- An email failure (`email_status = failed`) does NOT change `inquiry_status`.
- A token expiry (`chat_session_status = expired`) does NOT change `inquiry_status`.
- A booking cancellation does NOT cancel the inquiry.
- An inquiry cancellation does NOT automatically cancel a confirmed booking (admin should handle explicitly).
- Chat session expiry does NOT delete the inquiry or lead data.

---

## 2. Inquiry Status Lifecycle

### States

| Status | Entry condition | Description |
|---|---|---|
| `new_inquiry` | Form submitted | Initial state. Lead has expressed interest. |
| `conversation_started` | Chat token successfully validated | Lead has opened the private conversation. |
| `requirements_captured` | AI extracts budget/config/timeline | Lead's preferences have been captured. |
| `property_questions_answered` | Key FAQ questions answered by AI | Lead's property questions are addressed. |
| `visit_requested` | Lead asks about a site visit | Lead has expressed visit interest. |
| `follow_up_required` | Unanswered questions or admin flag | Needs human attention. |
| `completed` | Visit booked or admin marks complete | Inquiry fully handled. |
| `cancelled` | Lead or admin cancels | Inquiry discontinued. |

### Transition table

| From | To | Trigger | Actor |
|---|---|---|---|
| `new_inquiry` | `conversation_started` | Token validated, chat session established | system |
| `conversation_started` | `requirements_captured` | AI extracts lead preferences | ai |
| `conversation_started` | `property_questions_answered` | AI answers key questions | ai |
| `conversation_started` | `visit_requested` | User asks about visit directly | user |
| `requirements_captured` | `property_questions_answered` | AI answers key questions | ai |
| `property_questions_answered` | `requirements_captured` | User shares more preferences | user |
| `property_questions_answered` | `visit_requested` | User requests visit | user |
| `requirements_captured` | `visit_requested` | User requests visit | user |
| `visit_requested` | `completed` | Visit booked and confirmed | system |
| `visit_requested` | `follow_up_required` | No available slots or issues | system |
| `property_questions_answered` | `follow_up_required` | Unanswered questions remain | system/admin |
| `follow_up_required` | `completed` | Admin resolves | admin |
| Any state | `cancelled` | Lead or admin cancels | user/admin |
| Any state | `follow_up_required` | Admin flags | admin |

### Rules

1. Forward progression is the normal flow but is not strictly linear — leads may revisit states.
2. `cancelled` is terminal unless an admin explicitly reopens (not modelled in v1).
3. `completed` is terminal.
4. Every transition creates an `AuditEvent`.
5. The inquiry status never reflects email delivery or token validity.

---

## 3. Email Delivery Lifecycle

### States

| Status | Description |
|---|---|
| `pending` | Email send has been requested but not yet attempted or result not yet received |
| `sent` | Email sending service (Apps Script) accepted the send request |
| `failed` | Email sending service returned an error |

### Transition table

| From | To | Trigger | Actor |
|---|---|---|---|
| (creation) | `pending` | Inquiry created | system |
| `pending` | `sent` | Apps Script returns success | system |
| `pending` | `failed` | Apps Script returns error | system |
| `failed` | `pending` | Admin retries email send | admin |
| `pending` | `sent` | Retry succeeds | system |
| `pending` | `failed` | Retry fails | system |

### Rules

1. `sent` means the sending API accepted the request. It does NOT confirm that the recipient received or read the email.
2. `failed` stores the reason in `email_failure_reason`.
3. Retry resets status to `pending` and attempts again.
4. Retry does NOT create a new inquiry. It updates the existing inquiry.
5. Retry MAY generate a new token (old token is revoked, new hash stored, new expiry set).
6. Maximum 3 retry attempts before requiring manual admin intervention.
7. Email status transitions create `AuditEvent` records.

---

## 4. Chat Session Lifecycle

### States

| Status | Description |
|---|---|
| `active` | Token is valid and not expired or revoked |
| `expired` | Token has passed its expiry timestamp |
| `revoked` | Admin has explicitly revoked the token |

### Transition table

| From | To | Trigger | Actor |
|---|---|---|---|
| (creation) | `active` | Inquiry created with token | system |
| `active` | `expired` | Current time > `token_expires_at` | system (computed) |
| `active` | `revoked` | Admin revokes token | admin |
| `expired` | `active` | Admin issues new token | admin |
| `revoked` | `active` | Admin issues new token | admin |

### Rules

1. `expired` is computed at validation time: `now() > token_expires_at`.
2. `revoked` is an explicit boolean flag set by admin.
3. Expiry/revocation does NOT delete the inquiry, lead data or conversation history.
4. A new token can be issued, which stores a new hash and new expiry, resetting to `active`.
5. The old token becomes permanently invalid (old hash no longer matches any valid token).
6. Default expiry: 7 days from token creation.

### Token validation algorithm

```
1. Receive raw_token from client
2. Compute hash = SHA-256(raw_token)
3. Query: SELECT * FROM inquiry WHERE token_hash = hash
4. If no match → REJECT (invalid token)
5. If token_revoked = true → REJECT (revoked)
6. If token_expires_at < now() → REJECT (expired)
7. Otherwise → ACCEPT, return inquiry with joined property and builder data
8. On first successful validation: set chat_started_at, update inquiry_status
```

### Non-destructive GET contract

- `/chat/[token]` page load (HTTP GET) renders a loading shell.
- Client-side JavaScript sends `POST /api/chat/validate` with the token.
- The POST is what actually validates and potentially updates state.
- The GET itself never mutates data.
- Multiple GET requests to the same URL are safe.
- Email link preview scanners (which perform GET) cannot consume the token.

---

## 5. Booking Status Lifecycle

### States

| Status | Description |
|---|---|
| `none` | No booking record exists (nullable relationship) |
| `pending_confirmation` | Client-side transient state while awaiting backend response |
| `confirmed` | Backend has validated and saved the booking |
| `completed` | Admin marks visit as occurred |
| `cancelled` | User or admin has cancelled the booking |
| `no_show` | Admin marks that the user did not attend |
| `reschedule_requested` | User wants to change to a different slot |

### Transition table

| From | To | Trigger | Actor |
|---|---|---|---|
| `none` | `pending_confirmation` | User selects slot and submits | user (client) |
| `pending_confirmation` | `confirmed` | Backend validates and saves | system |
| `pending_confirmation` | `none` | Backend rejects (slot taken, etc.) | system |
| `confirmed` | `completed` | Admin marks visit complete | admin |
| `confirmed` | `cancelled` | User or admin cancels | user/admin |
| `confirmed` | `no_show` | Admin marks no-show | admin |
| `confirmed` | `reschedule_requested` | User requests reschedule | user |
| `reschedule_requested` | `confirmed` | New slot confirmed | system |
| `reschedule_requested` | `cancelled` | Unable to reschedule | user/admin |
| `cancelled` | `pending_confirmation` | User rebooks | user |

### Rules

1. `none` = no `Booking` record exists. No placeholder records.
2. `pending_confirmation` is transient — the frontend shows a spinner while the backend processes.
3. Only `confirmed` means the booking is real. The UI must NOT show "confirmed" until the backend responds with success.
4. One booking per inquiry (UNIQUE constraint on `inquiry_id`).
5. Rebooking after cancellation updates the existing record (status reset, new slot).
6. Rescheduling releases the old slot's capacity and reserves the new slot's capacity atomically.
7. All transitions create `AuditEvent` records.

### Booking validation checklist (backend)

```
1. Verify inquiry exists and is not cancelled
2. Verify chat session is active (not expired/revoked)
3. Verify slot belongs to the inquiry's property
4. Verify slot date is in the future (Asia/Kolkata)
5. Verify slot has remaining capacity (booked_count < max_capacity)
6. Verify visitor_name is non-empty
7. Verify visitor_email is valid format
8. Verify visitor_phone is provided (for visit coordination)
9. Verify visitor_count is integer 1–10
10. Check for duplicate booking (same inquiry_id)
11. Atomically: increment slot.booked_count, create/update booking record
12. Generate confirmation_code (8-char alphanumeric, unique)
13. Return confirmation or specific error
```

---

## 6. Complete Inquiry Lifecycle Example

```
Timeline for a successful lead conversion:

T+0s    User submits inquiry form on /ad/project-aster
        → inquiry_status: new_inquiry
        → email_status: pending
        → chat_session_status: active
        → booking_status: none
        → AuditEvent: inquiry_created

T+2s    Email send attempt succeeds
        → email_status: sent
        → AuditEvent: email_sent

T+5m    User opens /chat/[token] link
        → HTTP GET renders loading shell (no state change)

T+5m    Client POSTs to /api/chat/validate
        → Token validated
        → inquiry_status: conversation_started
        → chat_started_at: now()
        → AuditEvent: chat_session_started

T+6m    User asks "What configurations are available?"
        → AI answers from approved_facts
        → ChatMessage created (user + assistant)
        → inquiry_status: property_questions_answered
        → AuditEvent: inquiry_status_changed

T+8m    User says "I'm looking for a 3 BHK under ₹1 crore"
        → AI extracts preferences
        → LeadExtraction updated: budget_max=10000000, preferred_config="3 BHK"
        → inquiry_status: requirements_captured
        → AuditEvent: lead_extraction_updated

T+12m   User asks "Can I schedule a visit?"
        → inquiry_status: visit_requested
        → AI calls check_available_slots tool
        → Available slots returned and presented

T+13m   User selects Saturday 10:00 AM slot
        → Frontend shows review step with details
        → User confirms
        → booking_status: pending_confirmation (client state)
        → POST /api/bookings

T+13.5s Backend validates and saves booking
        → Booking record created
        → Slot booked_count incremented
        → booking_status: confirmed
        → inquiry_status: completed
        → confirmation_code: "ASTER7K"
        → AuditEvent: booking_created

T+14m   Admin views dashboard
        → Sees: Priya Sharma → Project Aster → Aster Habitat Demo
        → Inquiry: completed | Email: sent | Chat: active | Booking: confirmed
        → Timeline shows all events
```

---

## 7. Error Recovery Workflows

### Email failure recovery

```
1. Email send fails → email_status: failed, email_failure_reason stored
2. Inquiry preserved (inquiry_status remains new_inquiry)
3. Admin sees failed email in dashboard
4. Admin clicks "Retry Email"
5. System revokes old token, generates new token
6. email_status: pending → attempts send
7. On success: email_status: sent, new token active
8. On failure: email_status: failed, admin notified
```

### Slot capacity conflict during booking

```
1. User selects slot (appears available)
2. Another user books last capacity concurrently
3. Backend detects: booked_count >= max_capacity
4. Backend returns error: "This slot is no longer available"
5. Frontend refreshes available slots
6. User selects different slot
7. Booking proceeds normally
```

### Token expiry during conversation

```
1. User is in active conversation
2. Token expires (7 days from creation)
3. Next API call returns token_expired error
4. Chat page shows: "Your session has expired. Please contact support."
5. Conversation history preserved
6. Admin can issue new token if needed
```

---

## 8. Site-Visit Slot Configuration

Slots are generated dynamically based on per-property configuration. This avoids hardcoded dates that become stale.

### Slot generation rules

```typescript
interface SlotConfig {
  property_id: string;
  weekday_slots: TimeSlot[];     // Mon-Fri
  saturday_slots: TimeSlot[];    // Saturday
  sunday_slots: TimeSlot[];      // Sunday (usually empty)
  max_capacity_per_slot: number; // Default: 5
  advance_days: number;          // How many days ahead to generate (default: 14)
  blackout_dates: string[];      // Dates with no slots (holidays, etc.)
}

interface TimeSlot {
  start_time: string; // "10:00" (IST)
  end_time: string;   // "12:00" (IST)
}
```

### Default configuration

| Property | Weekday slots (IST) | Saturday slots (IST) | Sunday | Capacity |
|---|---|---|---|---|
| Project Aster | 10:00–12:00, 14:00–16:00 | 10:00–13:00 | Closed | 5 |
| Project Nila | 10:00–12:00, 14:00–16:00 | 10:00–13:00 | Closed | 5 |
| Project Cedar | 10:00–12:00, 15:00–17:00 | 10:00–12:00, 14:00–16:00 | Closed | 3 |

### Generation logic (to be implemented in Phase 3+)

```
For each day in [today+1 ... today+advance_days]:
  If day is in blackout_dates → skip
  Determine day_type (weekday, saturday, sunday)
  For each time_slot in config[day_type]:
    Create SiteVisitSlot {
      property_id, date, start_time, end_time,
      max_capacity, booked_count: 0, is_available: true
    }
```

The demo-data module defines the slot configuration. Actual slot records are generated at runtime or seeded when the database is populated.

---

## 9. Admin Action Permissions

| Action | Required role | Audit logged |
|---|---|---|
| View inquiry list | admin | No (read-only) |
| View inquiry detail | admin | No (read-only) |
| Revoke chat token | admin | Yes |
| Issue new chat token | admin | Yes |
| Retry failed email | admin | Yes |
| Change inquiry status | admin | Yes |
| Add admin note | admin | Yes |
| Cancel booking | admin | Yes |
| Mark booking completed | admin | Yes |
| Mark booking no-show | admin | Yes |
| Delete inquiry | admin | Yes (Phase 5+ consideration) |
| Export data | admin | Yes (if implemented) |

---

## 10. Duplicate and Concurrency Protection

### Inquiry deduplication

- Same email + same property within 5 minutes → reject with "Inquiry already submitted" message.
- Same email + same property after 5 minutes → create new inquiry (lead may genuinely re-enquire).
- Same email + different property → always allowed (separate inquiries).

### Booking deduplication

- Same inquiry_id → UNIQUE constraint prevents duplicate bookings.
- Rebooking after cancellation → UPDATE existing record, not INSERT.
- Use `ON CONFLICT (inquiry_id) DO NOTHING` or equivalent.

### Slot capacity concurrency

- Use `UPDATE ... SET booked_count = booked_count + 1 WHERE booked_count < max_capacity RETURNING *`.
- If no rows returned → slot is full.
- This provides atomic increment without explicit locking.
- Application-level retry is not needed; the user is asked to pick another slot.
