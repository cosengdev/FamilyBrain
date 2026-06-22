# FamilyBrain — product & system design

## Positioning

One product, two entry points: a solo adult gets the "Personal Life Admin Assistant"
experience (bills, renewals, budget, no kids/school modules); a household upgrades the
same account into the full "Family OS" (calendar, school, meal planning, chores). Same
data model and AI engine underneath — household size is a configuration, not a different
product. This avoids fragmenting into three separate apps and gives solo users a natural
upgrade path when they start a family.

## Personas

- **Overwhelmed parent** (primary) — dual-income, 2+ kids, juggling school/activities/appointments/money.
- **Solo adult** — no kids, wants the "AI life admin" pain solved: renewals, bills, spend insights.
- **Co-parent / blended family** — shared custody; needs one child's schedule/medical info visible across two households without merging finances.
- **Carer / babysitter / grandparent** — needs scoped, temporary access (today's pickup time, allergy info) without a full account.

## Feature set

- **Calendar & logistics** — shared family calendar, two-way sync (Google/Outlook/Apple),
  per-child colour coding, clash detection ("Mia's recital overlaps parents' evening"),
  carpool/pickup coordinator, RSVP tracking for parties.
- **AI daily brain** — morning briefing push ("Jason has football at 4pm, electricity
  bill due Friday, you can save £86 this month"), Sunday week-ahead digest, conversational
  assistant for natural-language actions, proactive anomaly nudges.
- **Renewals & life admin** (generalised, not just a handful of hardcoded types) —
  insurance, MOT, passport, visa, driving licence, TV licence, DBS checks, warranties, pet
  vaccinations, vehicle tax, "zombie subscription" detector — plus document-photo OCR that
  reads the expiry date for you instead of manual entry.
- **Family budget** — Open Banking account linking, auto-categorised bills, spend-anomaly
  insights, savings goals, kids' allowance ledger tied to chores, shared-vs-personal
  expense splitting (useful for co-parents).
- **Meal planning & shopping** — AI weekly meal plan (allergies, picky eaters, budget,
  what's already in the pantry), auto-generated shopping list, pantry inventory, "use-it-up"
  recipe suggestions.
- **Homework, chores & routines** — per-child homework tracker, gamified morning/bedtime
  routine checklists, rotating chore rota linked to allowance.
- **School communication hub** — centralised newsletter inbox per child/school,
  auto-imported term dates, permission-slip e-signing, parents'-evening booking.
- **Health, safety & emergency** — medical profile (allergies, conditions, GP, medication
  reminders), shareable emergency card for a babysitter (time-limited link, no full account
  needed), location/"I'm safe" check-in for older kids.
- **Document vault** — encrypted storage for passports, policies, certificates, with
  granular sharing per person/per household.
- **Permissions model** — Owner/Admin, Adult, Teen (own scoped view), Child (simplified
  gamified view), Carer (time-boxed scoped link); cross-household linking for separated
  families.

## System architecture

Web and mobile clients call into one platform with two functionally distinct halves:

- **Core services** — deterministic CRUD over calendar, tasks, budget, and documents.
- **AI assistant layer** — chat, insights, and proactive nudges, sitting alongside core
  services rather than replacing them.

Both are backed by shared data storage (Postgres, S3, Redis) and external integrations
(calendar sync providers, Open Banking, push/email/SMS, the LLM provider).

Splitting these matters: the AI layer should never be the system of record for dates or
money — it reads facts that core services computed and either narrates them or calls core
services' own write APIs as tools, never bypasses them.

## Data model (phase 0)

| Entity | Purpose |
|---|---|
| Household / User | Multi-tenant root; user has a role (Admin/Adult/Teen/Child/Carer) scoped to a household |
| CalendarEvent | Owner, time range, source (manual vs synced external calendar) |
| Task | Assignee, due date, completion |
| ShoppingItem | Quantity, checked state |
| Renewable | Generalised bill/insurance/MOT/passport/subscription with type, due date, amount, document ref |
| EmergencyContact | Name, relationship, phone |
| MedicalProfile | Per user: allergies, conditions, medications, GP details |
| Notification | Channel (push/email/SMS), body, sent state |

Phase 2+ entities (budget transactions, meal plans, school announcements) are deliberately
left out of the phase 0 schema until those modules are built — see roadmap below.

## AI assistant design — four layers, not one model call

1. **Deterministic core** — scheduled jobs compute facts (days-to-renewal,
   spend-vs-average, low pantry stock). Date and money math is never delegated to the LLM.
2. **Narration layer** — takes computed facts and turns them into the friendly daily
   briefing copy ("Your car insurance expires in 19 days").
3. **Conversational tool-calling layer** — free-text/voice input → LLM with defined tools
   (`create_event`, `add_shopping_item`, `get_budget_summary`) → executes through the same
   APIs the UI uses → confirms back in natural language. Anything touching money, legal
   documents, or a child's medical record gets an explicit confirm step.
4. **Document intelligence** — photographed documents → vision model extracts key fields
   (expiry date, policy number) → pre-fills the renewal tracker, user confirms before it's
   trusted as fact.

Claude is the recommended LLM provider given the tool-calling and vision needs.

## Recommended tech stack

| Layer | Choice | Why |
|---|---|---|
| Web | Next.js PWA | Installable, SSR for auth/marketing |
| Mobile | React Native (Expo) | Shares types/API client with web in this monorepo; real push notifications, calendar/contacts sync, widgets |
| Backend | Node.js + TypeScript (NestJS/tRPC) | End-to-end typed contracts |
| Database | PostgreSQL | Relational and permission-heavy data (households, roles, billing) — row-level security per household |
| Object storage | S3 | Documents, receipts |
| Cache/jobs | Redis + BullMQ | Reminders, renewal checks, digest generation |
| Realtime | Ably/Pusher | Live shared calendar/list updates |
| Auth | Clerk/Auth0 | Multi-user household auth with child-scoped roles |
| AI | Claude API | Tool-calling assistant, narration, document vision |
| Calendar sync | Google Calendar API, Microsoft Graph, Apple EventKit | Two-way sync |
| Open Banking | TrueLayer / Plaid / Yapily | FCA-regulated aggregator — never build bank scraping in-house |
| Notifications | FCM/APNs, Resend/Twilio | Push + email/SMS |

## Security, privacy & compliance — non-negotiable

- Encryption at rest/in transit, strictest for documents, medical, and financial data.
- Child accounts get minimal scopes by design — UK Children's Code (Age Appropriate
  Design Code) and GDPR considered before the schema is written, not retrofitted.
- Open Banking only via a regulated aggregator; FamilyBrain never sees or stores bank
  credentials.
- Full audit log of AI-initiated actions — important for trust, and for co-parenting
  disputes.
- Data export and right-to-erasure from day one.
- Independent security review before any real bank or medical data goes live.

## Monetization

- **Free** — one household, manual calendar/shopping/reminders, no AI, no bank sync.
- **Premium (~£7–9/mo)** — full AI assistant, Open Banking budget tracker, document vault
  + OCR, meal planning, unlimited members/schools.
- **Linked households** (co-parents) — small uplift for cross-household calendar/medical
  sharing.
- Later — opt-in affiliate referral when a renewal is surfacing ("compare insurance
  quotes"), school/PTA white-label.

## Phased roadmap

| Phase | Scope |
|---|---|
| 0 — Foundation | Auth, household/roles, shared calendar + sync, shopping list, manual bills/renewals tracker, emergency/medical card, rules-based daily digest. Web + mobile shell together. |
| 1 — AI core | Conversational tool-calling assistant, LLM-narrated briefing, document OCR for renewals. |
| 2 — Money & meals | Open Banking budget, spend insights, AI meal planner + pantry, allowance/chores. |
| 3 — School & scale | School comms integrations, carpool coordination, co-parent linking, voice assistant (Alexa/Siri), white-label. |

## Risks worth solving early, not late

- **No universal school API exists** — phase 0/1 likely means parent-forwarded emails
  parsed by AI, not real integrations. Set expectations accordingly.
- Keep phase-1 AI to **read/insight only** on money and legal documents — autonomous
  actions there carry real regulatory weight.
- Children's data is the highest-scrutiny area — design consent and child-account flows
  before the schema, not after.
- Trust is the actual product: nobody links a bank account or uploads a passport to an app
  they don't trust. Invest in visible data controls early, not just features.
