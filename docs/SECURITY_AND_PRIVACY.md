# IQOL — Security & Privacy Specification

> **Phase 1 deliverable** — Security requirements and privacy controls
> Created: 2026-10-20 · References: [PRODUCT_SPEC.md](file:///c:/Users/run40/Downloads/IQOL/docs/PRODUCT_SPEC.md), [DATA_DICTIONARY.md](file:///c:/Users/run40/Downloads/IQOL/docs/DATA_DICTIONARY.md)

---

## 1. Overview

This document specifies security and privacy requirements for the IQOL demonstration. These are specifications for implementation in Phases 3–7. They are NOT claims that these controls are currently enforced.

### Threat model scope

IQOL is a demonstration product with synthetic data. The threat model prioritises:
1. Preventing exposure of one lead's inquiry to another lead.
2. Protecting admin dashboard from unauthorised access.
3. Keeping API keys server-side.
4. Preventing the AI from fabricating property claims.
5. Preventing booking manipulation.

It does NOT address:
- Nation-state attackers.
- DDoS protection beyond Vercel's default.
- PCI-DSS compliance (no payments).
- GDPR data subject access requests (synthetic data only).

---

## 2. Authentication & Authorisation

### 2.1 Administrator authentication

| Requirement | Implementation |
|---|---|
| Auth provider | Supabase Auth (email/password) |
| Account provisioning | Single seeded admin account; no self-registration |
| Session management | Supabase Auth cookies (httpOnly, secure, sameSite) |
| Session validation | Server-side `getUser()` on every admin API request and page load |
| Route protection | Next.js middleware checks auth for `/admin/*` (except `/admin/login`) |
| Logout | Invalidate Supabase session, clear cookies, redirect to `/admin/login` |

### 2.2 Lead "authentication" (token-based)

| Requirement | Implementation |
|---|---|
| No account creation | Leads do not create accounts |
| Access mechanism | Cryptographic token in email link |
| Token generation | `crypto.randomBytes(32)` → 64-character hex string |
| Token storage | SHA-256 hash in `inquiry.token_hash` |
| Token validation | Hash presented token, compare to stored hash |
| Token expiry | Configurable (default 7 days), checked on every validation |
| Token revocation | Admin sets `token_revoked = true` |
| Non-destructive GET | Page GET does not validate/consume token; POST does |

### 2.3 Access control matrix

| Resource | Anonymous | Token holder | Admin |
|---|---|---|---|
| `/ad/[slug]` | ✅ Read | ✅ Read | ✅ Read |
| `POST /api/inquiries` | ✅ Submit | ✅ Submit | ✅ Submit |
| `/chat/[token]` page load | ✅ (shell only) | ✅ (shell only) | ✅ (shell only) |
| `POST /api/chat/validate` | ❌ (invalid token) | ✅ (valid token) | N/A |
| `POST /api/chat/gemini` | ❌ | ✅ (validated session) | N/A |
| `POST /api/bookings` | ❌ | ✅ (validated session) | N/A |
| `/admin/login` | ✅ | ✅ | ✅ |
| `/admin` | ❌ → redirect | ❌ → redirect | ✅ |
| Admin API routes | ❌ 401 | ❌ 401 | ✅ |

---

## 3. Token Security

### 3.1 Generation

```
raw_token = crypto.randomBytes(32).toString('hex')  // 64 hex chars
token_hash = SHA-256(raw_token)
token_expires_at = now() + TOKEN_EXPIRY_DAYS * 86400
```

### 3.2 Storage

- **Stored:** `token_hash` (SHA-256 of raw token), `token_expires_at`, `token_revoked`
- **Never stored:** Raw token
- **Never logged:** Raw token in application logs, error messages, or analytics

### 3.3 Validation flow

```
Client: POST /api/chat/validate { token: raw_token }
Server:
  1. hash = SHA-256(raw_token)
  2. inquiry = SELECT * FROM inquiry WHERE token_hash = hash
  3. if not found → 404 "Invalid link"
  4. if token_revoked → 403 "Link revoked"
  5. if token_expires_at < now() → 410 "Link expired"
  6. if valid → return { inquiry_id, property, builder }
  7. Update inquiry: chat_started_at, inquiry_status
  8. Create AuditEvent: chat_session_started
```

### 3.4 Token in URLs

- The raw token appears in the URL path: `/chat/{token}`
- This is necessary for email link functionality
- Mitigation: tokens are one-time-use-for-session (validation establishes a session), expire, and can be revoked
- The token does NOT appear in query parameters (no `?token=` leakage to referrer headers)
- `Referrer-Policy: no-referrer` set on chat pages

### 3.5 Brute-force protection

- 32 bytes of randomness = 256 bits of entropy → computationally infeasible to guess
- Rate limiting on `/api/chat/validate`: max 10 attempts per IP per minute
- Failed validation attempts logged (without the attempted token)

---

## 4. API Security

### 4.1 Server-side validation

All API routes that accept user input must:
1. Validate input with Zod schemas
2. Sanitise string inputs (trim, length limits)
3. Verify authorisation (token or admin session)
4. Return appropriate HTTP status codes
5. Never expose internal error details to the client

### 4.2 Input validation rules

| Route | Validation |
|---|---|
| `POST /api/inquiries` | name: string, 1–100 chars; email: valid format; phone: optional, 10–15 digits; message: optional, max 1000 chars; consent: must be true; slug: must match existing property |
| `POST /api/chat/validate` | token: string, exactly 64 hex chars |
| `POST /api/chat/gemini` | session_id: UUID; message: string, max 2000 chars; language: one of 6 codes |
| `POST /api/bookings` | inquiry_id: UUID; slot_id: UUID; visitor_name: 1–100 chars; visitor_email: valid format; visitor_phone: 10–15 digits; visitor_count: integer 1–10; notes: optional, max 500 chars |

### 4.3 CSRF protection

- API routes use POST for mutations (not GET)
- `SameSite=lax` cookies for admin auth
- Verify `Origin` header on mutation requests matches expected domain
- Token-based access (chat) is inherently CSRF-resistant (token must be presented)

### 4.4 Rate limiting

| Route | Limit | Window |
|---|---|---|
| `POST /api/inquiries` | 5 per email per hour | 1 hour |
| `POST /api/chat/validate` | 10 per IP per minute | 1 minute |
| `POST /api/chat/gemini` | 30 per session per minute | 1 minute |
| `POST /api/bookings` | 3 per session per hour | 1 hour |
| `POST /admin/login` (via Supabase) | Supabase default limits | Supabase managed |

Implementation: In-memory rate limiting is acceptable for the Vercel Hobby demonstration. Supabase or edge-based rate limiting if available.

---

## 5. Database Security

### 5.1 Row-Level Security (RLS)

All tables must have RLS enabled with explicit policies.

```sql
-- Public read for property catalogue
CREATE POLICY "Public can read builders" ON builder
  FOR SELECT USING (true);

CREATE POLICY "Public can read properties" ON property
  FOR SELECT USING (true);

CREATE POLICY "Public can read available future slots" ON site_visit_slot
  FOR SELECT USING (date >= CURRENT_DATE);

-- Sensitive tables: service role only
CREATE POLICY "Service role only" ON inquiry
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON booking
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON chat_message
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON lead_extraction
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON audit_event
  FOR ALL USING (auth.role() = 'service_role');
```

### 5.2 Client access pattern

| Client | Key used | Permitted operations |
|---|---|---|
| Browser (public pages) | `SUPABASE_ANON_KEY` | Read: builder, property, site_visit_slot |
| Browser (admin pages) | `SUPABASE_ANON_KEY` + auth session | Read: admin-accessible via auth policies |
| Next.js API routes | `SUPABASE_SERVICE_ROLE_KEY` | Full CRUD on all tables |

The service role key is NEVER exposed to the browser. It is used exclusively in server-side API routes and server components.

### 5.3 SQL injection prevention

- All database queries use Supabase client library (parameterised queries)
- No raw SQL string concatenation
- Zod validation on all inputs before any database operation

---

## 6. API Key Management

### 6.1 Server-side only keys

| Key | Exposure |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only (API routes, server components) |
| `GEMINI_API_KEY` | Server-side only (API routes) |
| `APPS_SCRIPT_SECRET` | Server-side only (API routes) |
| `APPS_SCRIPT_URL` | Server-side only (API routes) |

### 6.2 Client-side keys

| Key | Exposure | Justification |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side | Required for Supabase client; RLS protects data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side | Required for Supabase client; anon key by design |
| `NEXT_PUBLIC_BASE_URL` | Client-side | Public URL, no secret |

### 6.3 Gemini API key protection

- The Gemini API key is used only in `POST /api/chat/gemini`
- The browser never sees the Gemini API key
- If Gemini Live API supports short-lived client tokens, prefer those over proxying all traffic
- The short-lived token approach must be verified during Phase 4 integration

### 6.4 Environment variable handling

- `.env.local` is in `.gitignore` — never committed
- `.env.local.example` documents required variables without values
- Vercel environment variables set in the dashboard
- No secrets in `next.config.ts`, source code, or documentation

---

## 7. AI Safety Controls

### 7.1 System prompt scoping

The Gemini system prompt for each chat session includes:
1. The specific property's `approved_facts` JSON
2. The specific property's `faqs` array
3. The associated builder's approved details
4. Instructions to ONLY use these facts
5. Instructions for the fallback response when information is unavailable
6. The current language preference

The system prompt does NOT include:
- Other properties' data
- Admin credentials or API keys
- Raw database connection strings
- Other leads' personal information

### 7.2 Tool call validation

Every AI tool call is intercepted by the Next.js API route:

```
AI requests: check_available_slots({ property_id: "..." })
API route:
  1. Verify session is valid
  2. Verify property_id matches session's property
  3. If property_id doesn't match → REJECT, return error to AI
  4. Execute query against database
  5. Return sanitised results to AI
```

The AI cannot:
- Query slots for a different property
- Create a booking without backend validation
- Modify inquiry status directly
- Access other leads' data
- Execute arbitrary database queries

### 7.3 Content safety

- AI must not generate content that could be mistaken for legal advice or financial guarantees
- All property facts prefaced with "In this demonstration" context when appropriate
- No real-world property claims, RERA numbers, or builder certifications
- Responses flagged as potentially harmful by Gemini's safety filters are not forwarded to the user

---

## 8. Privacy Controls

### 8.1 Data collection minimisation

| Data point | Collected | Purpose | Retention |
|---|---|---|---|
| Full name | Yes (inquiry form) | Lead identification | Until admin deletes |
| Email | Yes (inquiry form) | Email delivery, identification | Until admin deletes |
| Phone | Optional (booking) | Visit coordination | Until admin deletes |
| Message | Optional (inquiry form) | Lead context | Until admin deletes |
| Consent | Yes (inquiry form) | Legal basis | Until admin deletes |
| Chat transcript | Yes (text only) | Demo conversation log | Until admin deletes |
| Voice audio | **No** | Not stored | N/A |
| IP address | Incidental (server logs) | Rate limiting | Vercel log retention |
| Browser fingerprint | **No** | Not collected | N/A |

### 8.2 User-facing notices

Three notices are required:

1. **Inquiry form (pre-submission):**
   > "By submitting, you consent to IQOL Demo storing your name and email address to facilitate a property conversation. All property information is synthetic demonstration data. Your details will not be shared with third parties."

2. **Chat page (persistent banner):**
   > "This conversation is recorded as text for demonstration purposes. Voice audio is not stored. To request removal of your data, contact the administrator."

3. **Booking confirmation:**
   > "Your visit details are stored for coordination purposes. This is a demonstration booking for a fictional property."

### 8.3 Data handling rules

- Personal data is accessible only to authenticated administrators and the system (service role)
- Chat transcripts are not visible to other leads
- Export functionality (if implemented) requires admin authentication
- No personal data in application logs (except incidental server access logs)
- No personal data in error messages returned to clients
- No tracking pixels, third-party analytics, or advertising cookies in v1

### 8.4 Synthetic data requirements

- All seed/demo data uses `@example.test` email addresses
- All seed phone numbers are clearly non-dialable (e.g., `+91 00000 00000`)
- No real people's names used in seed data
- All property and builder data is explicitly fictional
- Every record has `is_synthetic: true` or equivalent marker

---

## 9. HTTP Security Headers

The following headers should be set via Next.js middleware or `next.config.ts`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), geolocation=(), microphone=(self)
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=63072000; includeSubDomains
```

### Microphone permissions

- `Permissions-Policy: microphone=(self)` allows microphone access only from the same origin
- The browser's native permission dialog controls actual mic access
- The application requests mic permission only when the user taps the microphone button (not on page load)

---

## 10. Security Checklist (Phase 6 Verification)

This checklist will be verified during Phase 6:

- [ ] All API routes validate input with Zod schemas
- [ ] All mutation routes verify authorisation (token or admin session)
- [ ] Service role key is not exposed in client-side code
- [ ] Gemini API key is not exposed in client-side code
- [ ] Token hash comparison is timing-safe
- [ ] Token validation does not leak information about valid/invalid tokens beyond status
- [ ] GET requests to /chat/[token] do not mutate state
- [ ] Rate limiting is active on sensitive endpoints
- [ ] RLS is enabled on all tables
- [ ] Admin routes require authentication
- [ ] Admin session is validated server-side (not client-only)
- [ ] No personal data in error responses
- [ ] No raw tokens in application logs
- [ ] `.env.local` is in `.gitignore`
- [ ] Privacy notices displayed on inquiry form, chat page, and booking confirmation
- [ ] HTTPS enforced (Vercel default)
- [ ] Security headers configured
- [ ] AI cannot fabricate property facts (tested with unknown questions)
- [ ] AI tool calls are property-scoped and validated
- [ ] Booking cannot be created with expired/revoked token
- [ ] Concurrent booking attempts handled correctly
- [ ] Duplicate inquiry protection working
- [ ] Duplicate booking protection working
