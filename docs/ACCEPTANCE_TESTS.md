# IQOL — Acceptance Tests

> **Phase 1 deliverable** — Testable acceptance scenarios
> Created: 2026-10-20 · References: [PRODUCT_SPEC.md](file:///c:/Users/run40/Downloads/IQOL/docs/PRODUCT_SPEC.md), [WORKFLOW_AND_STATUSES.md](file:///c:/Users/run40/Downloads/IQOL/docs/WORKFLOW_AND_STATUSES.md), [SECURITY_AND_PRIVACY.md](file:///c:/Users/run40/Downloads/IQOL/docs/SECURITY_AND_PRIVACY.md)

---

## Priority Levels

| Priority | Meaning |
|---|---|
| **P0** | Must pass before any demonstration. Blocking. |
| **P1** | Must pass before deployment. Critical functionality. |
| **P2** | Should pass. Important for quality. |
| **P3** | Nice to have. Polish and edge cases. |

---

## 1. Inventory Consistency (Data Module)

### INV-01: Every property references a valid builder (P0)

**Given** the canonical demo data module is loaded
**When** each property's `builder_id` is checked
**Then** it matches exactly one existing builder record

### INV-02: Multiple properties may reference the same builder (P0)

**Given** the demo data contains Builder "Aster Habitat Demo"
**When** properties are filtered by that builder
**Then** both "Project Aster" and "Project Nila" are returned

### INV-03: Property slugs are unique (P0)

**Given** the demo data module
**When** all property slugs are collected
**Then** no duplicates exist (`project-aster`, `project-nila`, `project-cedar` are all distinct)

### INV-04: Property IDs are unique (P0)

**Given** the demo data module
**When** all property IDs are collected
**Then** no duplicates exist

### INV-05: Property facts match canonical records (P0)

**Given** "Project Aster" in the demo data
**When** its price range is checked
**Then** it reads "₹75 lakh–₹1.15 crore" and configurations include 2 BHK and 3 BHK

### INV-06: Unknown fields are not filled with invented answers (P0)

**Given** a property record with `unknown_facts` listing "Exact maintenance charges"
**When** the approved_facts are searched for maintenance charges
**Then** no maintenance charge value is found in approved_facts

### INV-07: All prices use INR with Indian formatting (P0)

**Given** any property record
**When** prices are displayed
**Then** currency is ₹/INR with lakh/crore conventions and Indian digit grouping
**And** no USD, EUR, GBP or foreign currency appears

### INV-08: All locations are Bengaluru, Karnataka (P0)

**Given** any property record
**When** location fields are inspected
**Then** city is "Bengaluru", state is "Karnataka"
**And** locality is a valid Bengaluru locality

### INV-09: All records are marked as synthetic (P0)

**Given** every property and builder record
**When** `is_synthetic` flag is checked
**Then** it is `true`

### INV-10: Builder records are consistent (P0)

**Given** "Cedar Urban Demo" builder
**When** its associated properties are queried
**Then** exactly "Project Cedar" is returned

---

## 2. Property Advertisement Page (`/ad/[slug]`)

### AD-01: Valid slug renders property page (P0)

**Given** the URL `/ad/project-aster`
**When** the page loads
**Then** the page displays "Project Aster (DEMO)" with Whitefield, Bengaluru location
**And** the page includes hero image, highlights, amenities, FAQ and inquiry form

### AD-02: Invalid slug shows 404 (P0)

**Given** the URL `/ad/nonexistent-property`
**When** the page loads
**Then** a friendly 404 page is shown with navigation back to valid properties

### AD-03: Property details are accurate (P0)

**Given** `/ad/project-nila`
**When** the highlights section is inspected
**Then** configurations show "2 BHK, 3 BHK"
**And** price shows "₹85 lakh–₹1.30 crore"
**And** area shows "1,050–1,580 sq. ft."
**And** location shows "Sarjapur Road, Bengaluru"

### AD-04: Builder badge shows correct builder (P1)

**Given** `/ad/project-aster`
**When** the builder badge is inspected
**Then** it shows "Aster Habitat Demo"

**Given** `/ad/project-cedar`
**When** the builder badge is inspected
**Then** it shows "Cedar Urban Demo"

### AD-05: FAQ accordion displays approved answers (P1)

**Given** `/ad/project-aster`
**When** the FAQ section is expanded
**Then** at least 12 Q&A pairs are shown
**And** answers match the canonical data

### AD-06: Amenities grid is complete (P1)

**Given** any property page
**When** the amenities section is inspected
**Then** all approved amenities from the canonical data are displayed
**And** no unapproved amenities are shown

### AD-07: No foreign elements on page (P0)

**Given** any property advertisement page
**When** the page content is inspected
**Then** no USD/EUR/GBP symbols, no foreign addresses, no non-Indian architecture images appear

---

## 3. Inquiry Form Submission

### INQ-01: Valid submission creates inquiry (P0)

**Given** the inquiry form on `/ad/project-aster`
**When** name="Priya Sharma", email="priya@example.test", consent=checked, submit clicked
**Then** `POST /api/inquiries` creates an inquiry record
**And** response status is 201
**And** `inquiry_status` is `new_inquiry`
**And** `email_status` is `pending`
**And** `chat_session_status` is `active`

### INQ-02: Email validation prevents invalid emails (P0)

**Given** the inquiry form
**When** email="not-an-email" is submitted
**Then** the form shows an inline validation error
**And** no API request is made

### INQ-03: Name is required (P0)

**Given** the inquiry form
**When** name is empty and form is submitted
**Then** the form shows an inline validation error

### INQ-04: Consent is required (P0)

**Given** the inquiry form
**When** consent checkbox is unchecked and form is submitted
**Then** the form shows a validation error

### INQ-05: Successful submission shows confirmation (P0)

**Given** a valid inquiry submission
**When** the API returns success
**Then** the form is replaced with a confirmation message: "Check your email for a private conversation link"

### INQ-06: Duplicate within 5 minutes is rejected (P2)

**Given** an inquiry just submitted for priya@example.test on project-aster
**When** the same email submits again for project-aster within 5 minutes
**Then** the API returns a message: "Inquiry already submitted"
**And** no duplicate inquiry is created

### INQ-07: Same email for different property is accepted (P1)

**Given** an inquiry exists for priya@example.test on project-aster
**When** priya@example.test submits for project-nila
**Then** a new inquiry is created for project-nila

### INQ-08: Email failure preserves inquiry (P0)

**Given** the email sending service fails
**When** the inquiry is checked in the database
**Then** the inquiry record exists with `email_status = failed`
**And** `inquiry_status` remains `new_inquiry` (not cancelled)

### INQ-09: Server error shows user-friendly message (P1)

**Given** a server error during inquiry creation
**When** the error response is shown to the user
**Then** a generic error message is displayed with a retry option
**And** no internal error details are exposed

---

## 4. Email Delivery

### EMAIL-01: Email contains correct property link (P0)

**Given** an inquiry for project-aster
**When** the email is sent
**Then** the email body contains a link to `/chat/{valid_token}`
**And** the email subject mentions "Project Aster"

### EMAIL-02: Email does not contain sensitive data (P1)

**Given** any sent email
**When** its content is inspected
**Then** it does not contain the user's phone number, other users' data, or API keys

### EMAIL-03: Email retry does not duplicate inquiry (P1)

**Given** an inquiry with `email_status = failed`
**When** admin retries the email
**Then** the existing inquiry is updated (not duplicated)
**And** a new token is generated if needed

### EMAIL-04: Email failure is visible in admin dashboard (P1)

**Given** an inquiry with `email_status = failed`
**When** admin views the dashboard
**Then** the failed email is clearly indicated with the failure reason

---

## 5. Token & Session Handling

### TOK-01: Valid token loads correct inquiry (P0)

**Given** a valid, non-expired, non-revoked token for project-aster
**When** `POST /api/chat/validate` is called with the token
**Then** the API returns inquiry details with project-aster data
**And** builder "Aster Habitat Demo" is included

### TOK-02: GET request does not consume token (P0)

**Given** a valid token
**When** `GET /chat/{token}` is requested multiple times
**Then** the token remains valid
**And** no database state is mutated by the GET request

### TOK-03: Repeated GET requests are safe (P0)

**Given** a valid token
**When** `GET /chat/{token}` is requested 10 times
**Then** all requests return the page shell successfully
**And** the token is still valid for validation

### TOK-04: Invalid token returns error without data (P0)

**Given** a random string as token
**When** `POST /api/chat/validate` is called
**Then** the API returns 404
**And** no inquiry details are exposed

### TOK-05: Expired token returns expiry message (P0)

**Given** a token whose `token_expires_at` is in the past
**When** `POST /api/chat/validate` is called
**Then** the API returns 410
**And** the response indicates "Link expired"
**And** no inquiry details are exposed

### TOK-06: Revoked token returns revocation message (P0)

**Given** a token with `token_revoked = true`
**When** `POST /api/chat/validate` is called
**Then** the API returns 403
**And** the response indicates "Link revoked"
**And** no inquiry details are exposed

### TOK-07: Token cannot switch to a different property (P0)

**Given** a valid token for project-aster
**When** the client attempts to request data for project-nila
**Then** the API rejects the request
**And** only project-aster data is returned

### TOK-08: Token hash is stored, not raw token (P0)

**Given** an inquiry in the database
**When** the `token_hash` field is inspected
**Then** it is a SHA-256 hash (64 hex characters)
**And** the raw token is not stored in any database column

### TOK-09: Brute force is rate-limited (P2)

**Given** more than 10 validation attempts from the same IP in 1 minute
**When** the 11th attempt is made
**Then** the API returns 429 Too Many Requests

---

## 6. Conversation Behaviour

### CONV-01: Available fact is answered from canonical data (P0)

**Given** a chat session for project-aster
**When** the user asks "What is the price range?"
**Then** the AI responds with "₹75 lakh–₹1.15 crore" (or equivalent)
**And** the response matches canonical data

### CONV-02: Unknown fact receives fallback (P0)

**Given** a chat session for project-aster
**When** the user asks about a fact listed in `unknown_facts` (e.g., "What is the exact maintenance charge?")
**Then** the AI responds with the defined fallback: "I don't have verified information about that in this demo's property data. I can note your question for follow-up."

### CONV-03: AI does not fabricate property claims (P0)

**Given** a chat session
**When** the user asks "What is the expected annual appreciation?"
**Then** the AI does NOT provide a percentage or financial projection
**And** the AI uses the fallback response

### CONV-04: Language switching preserves property context (P1)

**Given** a chat session for project-aster in English
**When** the user switches to Hindi
**Then** the AI responds in Hindi
**And** the property context remains project-aster
**And** the property details section still shows project-aster data

### CONV-05: Text input works when voice is unavailable (P0)

**Given** the chat page with microphone permission denied
**When** the user types a message and clicks send
**Then** the AI responds via text
**And** the conversation functions normally

### CONV-06: Manual language selector works (P1)

**Given** the chat header language dropdown
**When** the user selects "Kannada"
**Then** the AI's next response is in Kannada

### CONV-07: Unsupported booking claim does not change state (P0)

**Given** a chat session
**When** the AI model attempts to directly call `create_booking` without valid slot data
**Then** the backend rejects the tool call
**And** no booking record is created

---

## 7. Booking

### BOOK-01: Available future slot can be booked (P0)

**Given** a valid chat session for project-aster
**And** an available future slot exists
**When** the user selects the slot, fills in details, and confirms
**Then** the booking is created with `booking_status = confirmed`
**And** a confirmation code is returned
**And** the slot's `booked_count` is incremented

### BOOK-02: Slot from different property is rejected (P0)

**Given** a chat session for project-aster
**When** a booking request references a slot belonging to project-nila
**Then** the API returns an error
**And** no booking is created

### BOOK-03: Past slot is rejected (P0)

**Given** a slot with a date in the past
**When** a booking request references this slot
**Then** the API returns an error: "Slot is no longer available"

### BOOK-04: Expired session cannot book (P0)

**Given** a chat session with an expired token
**When** a booking request is submitted
**Then** the API returns 403 or 410
**And** no booking is created

### BOOK-05: Double submission does not create duplicates (P0)

**Given** a booking already exists for an inquiry
**When** the same inquiry submits another booking request
**Then** the API returns the existing booking or an error
**And** no duplicate booking record is created

### BOOK-06: Concurrent overbooking is prevented (P0)

**Given** a slot with 1 remaining capacity
**When** two booking requests arrive simultaneously
**Then** exactly one succeeds
**And** the other receives "Slot is no longer available"
**And** `booked_count` does not exceed `max_capacity`

### BOOK-07: Confirmation appears only after backend success (P0)

**Given** a booking submission
**When** the backend has not yet responded
**Then** the UI shows a loading/pending state
**And** "Booking confirmed" is NOT displayed until the backend returns success

### BOOK-08: Booking confirmation shows correct details (P1)

**Given** a confirmed booking
**When** the confirmation card is displayed
**Then** it shows: property name, date (IST), time (IST), visitor name, confirmation code

### BOOK-09: No available slots shows empty state (P2)

**Given** all slots for a property are fully booked or in the past
**When** the user requests a visit
**Then** the UI shows: "No available slots at this time. We can note your interest for follow-up."

### BOOK-10: User can review details before confirming (P1)

**Given** the user selects a slot
**When** the review step is displayed
**Then** it shows: date, time, property name, visitor details
**And** a "Confirm Visit" button and a "Change" option are visible

### BOOK-11: Visitor contact number is collected for booking (P1)

**Given** the booking review step
**When** visitor_phone is empty
**Then** the form requires a contact number before allowing confirmation

---

## 8. Operations Dashboard

### DASH-01: User-property-builder shown correctly (P0)

**Given** an inquiry from "Priya Sharma" for project-aster (builder: Aster Habitat Demo)
**When** admin views the inquiry table
**Then** the row shows: Priya Sharma | priya@example.test | Project Aster | Aster Habitat Demo

### DASH-02: Multiple inquiries by same user are distinct (P0)

**Given** "Priya Sharma" has inquiries for project-aster and project-nila
**When** admin views the table
**Then** two separate rows appear, each with the correct property and builder

### DASH-03: Booking changes reflect in inquiry details (P1)

**Given** a booking status changes from `confirmed` to `cancelled`
**When** admin views the inquiry detail panel
**Then** the booking status shows `cancelled`
**And** the audit timeline shows the cancellation event

### DASH-04: Unauthenticated access is rejected (P0)

**Given** a user is not logged in as admin
**When** they navigate to `/admin`
**Then** they are redirected to `/admin/login`

**Given** an unauthenticated request to an admin API route
**When** the request is received
**Then** a 401 response is returned

### DASH-05: Failed emails identifiable (P1)

**Given** an inquiry with `email_status = failed`
**When** admin views the table
**Then** the email status column shows a failure indicator
**And** the detail panel shows the failure reason

### DASH-06: Unanswered questions visible (P1)

**Given** an inquiry with unanswered questions in `LeadExtraction`
**When** admin views the detail panel
**Then** the unanswered questions are listed in a "Follow-up required" section

### DASH-07: Search works across lead name and email (P1)

**Given** the inquiry table
**When** admin types "Priya" in the search box
**Then** only inquiries matching "Priya" in name or email are shown

### DASH-08: Filter by inquiry status works (P1)

**Given** the inquiry table
**When** admin filters by `visit_requested`
**Then** only inquiries with that status are shown

### DASH-09: Admin can revoke a chat token (P1)

**Given** an inquiry with an active chat token
**When** admin clicks "Revoke Token"
**Then** `token_revoked` is set to `true`
**And** an audit event is created
**And** subsequent chat validation fails

### DASH-10: Admin can add a note (P2)

**Given** an inquiry detail panel
**When** admin types a note and saves
**Then** the note is stored in `admin_notes`
**And** an audit event is created

### DASH-11: Timeline shows chronological events (P2)

**Given** an inquiry with multiple audit events
**When** admin views the timeline in the detail panel
**Then** events are shown in chronological order with timestamps in IST

---

## 9. UX & Accessibility

### UX-01: Mobile layout renders correctly (P1)

**Given** a viewport width of 375px (mobile)
**When** `/ad/project-aster` is loaded
**Then** all content is visible in a single-column layout
**And** no horizontal scrolling is required
**And** the inquiry form is fully functional

### UX-02: Tablet layout adapts correctly (P2)

**Given** a viewport width of 768px (tablet)
**When** any page is loaded
**Then** the layout adapts appropriately (wider content, possible side-by-side elements)

### UX-03: Property and builder details below voice section (P0)

**Given** the chat page for a valid token
**When** the page is scrolled
**Then** the property details (Section C) appear directly below the conversation area (Section B)
**And** the builder details (Section D) appear directly below the property details

### UX-04: Microphone denial shows fallback (P0)

**Given** the chat page
**When** the user denies microphone permission
**Then** voice controls are hidden or disabled
**And** a notice explains that text input is available
**And** the text input field is visible and functional

### UX-05: Loading states use skeletons (P1)

**Given** any page that loads data
**When** data is being fetched
**Then** a skeleton/shimmer placeholder is shown (not a blank page)

### UX-06: Success state shows confirmation (P1)

**Given** a successful inquiry submission
**Then** a confirmation message replaces the form

**Given** a successful booking
**Then** a confirmation card with details is shown

### UX-07: Error state shows retry (P1)

**Given** a recoverable error (network failure, server error)
**When** the error is displayed
**Then** a retry button is available
**And** no internal error details are shown

### UX-08: Expired link state is clear (P1)

**Given** an expired chat token
**When** the user opens the link
**Then** a friendly message explains the link has expired
**And** guidance is provided (e.g., "Contact the team for a new link")

### UX-09: Keyboard navigation works (P2)

**Given** the inquiry form on `/ad/project-aster`
**When** the user navigates using Tab key
**Then** focus moves through all form fields in logical order
**And** each focused element has a visible focus indicator

### UX-10: Contrast ratio meets WCAG AA (P2)

**Given** any text element on any page
**When** its contrast ratio against its background is measured
**Then** it meets a minimum of 4.5:1 for normal text and 3:1 for large text

### UX-11: Reduced motion is respected (P2)

**Given** `prefers-reduced-motion: reduce` is set in the browser
**When** any page with animations is loaded
**Then** animations are disabled or significantly reduced

### UX-12: All dates use Indian format (P0)

**Given** any date displayed on any page
**When** the format is inspected
**Then** it uses `DD Mon YYYY` format (e.g., "20 Oct 2026")
**And** times show IST

---

## 10. Cross-Cutting

### CC-01: No secrets in client-side code (P0)

**Given** the built client-side JavaScript
**When** it is searched for `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or `APPS_SCRIPT_SECRET`
**Then** none are found

### CC-02: All pages include synthetic data disclaimer (P1)

**Given** any page (`/ad/*`, `/chat/*`, `/admin`)
**When** the footer or header is inspected
**Then** a notice indicating synthetic/demo data is present

### CC-03: No foreign location references (P0)

**Given** a full-text search of all source files and rendered pages
**When** searching for "Mumbai", "Delhi", "Hyderabad", "New York", "USD", "$", "€", "£"
**Then** no user-facing references to foreign locations or currencies are found (code comments and documentation excluded)

### CC-04: Date values not shifted by timezone (P1)

**Given** a site-visit slot for "25 Nov 2026"
**When** displayed in the UI
**Then** it shows "25 Nov 2026" regardless of the user's browser timezone
**And** it does NOT show "24 Nov 2026" or "26 Nov 2026"

---

## 11. Test Implementation Notes

| Test category | Test method | Phase |
|---|---|---|
| Inventory (INV-*) | Unit tests against demo-data module | Phase 2 |
| Property ad (AD-*) | E2E tests (Playwright) | Phase 2–3 |
| Inquiry (INQ-*) | Integration tests + E2E | Phase 3 |
| Email (EMAIL-*) | Integration tests with mocked Apps Script | Phase 3 |
| Token (TOK-*) | Unit tests + integration tests | Phase 3 |
| Conversation (CONV-*) | Integration tests + manual browser testing | Phase 4 |
| Booking (BOOK-*) | Integration tests + E2E | Phase 5 |
| Dashboard (DASH-*) | E2E tests | Phase 5 |
| UX/A11y (UX-*) | Lighthouse + axe-core + manual | Phase 6 |
| Cross-cutting (CC-*) | Automated search + manual review | Phase 6 |
