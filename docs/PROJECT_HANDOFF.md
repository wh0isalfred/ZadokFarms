# Zadok Farm — Project Handoff and Current State

Last updated: 17 September 2026

This is the compact continuity document for a fresh Codex or Claude session. Read `AGENTS.md` first; this file records the approved product and current implementation state.

## Product in one sentence

Build the public website and light operational system on which Zadok Farm presents produce, receives traceable WhatsApp-led order requests, accepts training registrations and service enquiries, and lets approved staff manage the work without becoming a full ERP.

## Business and brand context

- Public name: **Zadok Farm**.
- Established in 2024.
- Mission direction: contribute to food security in Nigeria and Africa through sustainable, climate-resilient agriculture.
- Activities: crop and livestock production, greenhouse farming/construction, agricultural training, consulting and produce supply.
- Current concept catalogue: habanero pepper, bell pepper, cucumber, tomatoes, watermelon, plantain, maize, seedlings and snails.
- Planned products such as poultry, fish, herbs and green vegetables are not to be published as current stock without confirmation.
- Zadok Foundation is the parent initiative. The farm should feel related, but not visually identical.
- Logo is being developed separately and will be integrated when supplied.

## Approved product decisions

- Full e-commerce catalogue experience, but **not** conventional online checkout.
- No customer accounts.
- Basket → server-side order request/reference → prepared WhatsApp message → staff availability confirmation → payment information through WhatsApp → staff payment confirmation → pickup/delivery.
- WhatsApp remains the principal customer communication channel in the first release.
- Prices and availability are staff-managed and may change frequently.
- Submitted customer/order information lives on the server. Local storage is only for convenience/drafts.
- Produce ordering and bulk ordering must not imply that stock is guaranteed before staff confirmation.
- Wholesale information supplied by the stakeholder currently includes a Tuesday 08:00–Wednesday 12:00 order window, Wednesday 18:30–Thursday 18:30 pickup window, payment after confirmation, a maximum 24-hour perishable hold and free delivery for bulk customers. Treat these as configurable operational policy/content and reconfirm before enforcing them in code.
- Training is configurable programme registration/application. Staff creates programmes and their options; applicants register; staff reviews/approves and sends email follow-up. Course delivery, attendance, certificates and starter packs are not first-release website functions.
- Greenhouse construction and consulting use enquiry flows. Later quotations/calls/site visits remain operationally handled.
- Proper bookkeeping/accounting stays outside this product. The website provides operational visibility, not accounting software.
- Staff structure should remain simple. The approved database roles are owner, admin and staff. Do not assume a final staff count or shared credentials; each accountable person should ultimately use an individual identity.
- Strong low-connectivity behaviour is required, but stock-sensitive final actions cannot falsely complete offline.

## Visual and interaction direction

- Product-first homepage; no conventional hero before the catalogue.
- Tailored responsive behaviour rather than a desktop layout merely squeezed onto mobile.
- Desktop: sticky capsule navigation.
- Mobile: top-right basket plus bottom navigation; avoid redundant sticky navigation.
- Brand mood: grounded, capable, human, spacious and alive.
- Avoid: generic grocery-store UI, over-editorial layouts, excessive cards/underlines, AI-modern gradients, visual choking and decorative colour without hierarchy.
- Palette: `#F7F0E3`, `#11120F`, `#1D5134`, `#8DA68B`, `#B95832`, `#D8BA86`; usage rules live in `AGENTS.md`.
- Field-line strips and restrained scroll/micro-motion should add identity at strategic points, with reduced-motion support.
- The supplied Zadok design/motion transcript is a design-principles reference. Use it to strengthen hierarchy, emotional intention, system consistency, responsive thinking and pre-mortem testing—not to add unapproved features.

## Technical foundation

- Repository: `wh0isalfred/ZadokFarms`
- Production concept: `https://zadokfarms.vercel.app/`
- Framework: Next.js 16.3.4 App Router, React 19.2.8, TypeScript strict mode.
- Data/auth/storage: Supabase (`@supabase/ssr`, `@supabase/supabase-js`).
- Validation dependency: Zod.
- Hosting: Vercel free plan for now.
- Environment contract: `.env.example`; real values belong in ignored/local or platform environment settings.
- Current default branch: `main`.

## Implemented database foundation

The live Supabase project and committed migrations contain:

- `staff_profiles`
- `product_categories`
- `products`
- `product_images`
- `customers`
- `order_requests`
- `order_items`
- `order_status_events`
- `inventory_adjustments`
- derived `product_inventory` view

RLS is enabled. Public access is limited to published catalogue data; staff capabilities require authenticated, active profiles. Inventory is append-only. Relevant helper functions use controlled search paths and grants.

Committed migrations:

- `20260916201201_commerce_foundation.sql`
- `20260916201607_commerce_foundation_advisor_fixes.sql`
- `20260916201850_allow_public_catalogue_staff_check.sql`

The catalogue is seeded with the nine concept products and reads from Supabase server-side, with the former static list retained only as a temporary resilience fallback.

## Completed ordering increments

Basket milestones are complete in `d791867` and `d1c8002`: versioned/validated device-local persistence, stale/unavailable product removal, cross-tab sync, focus trap/restoration, labelled 44px controls, live quantity announcements and correct empty-drawer ARIA.

The request boundary began in `8bef487`, with generated types corrected in `e1691ca`. This forward correction completes:

- Progressive basket review to Request details, back navigation, full-height mobile scrolling and return to review when empty.
- Required full name, international WhatsApp number, and pickup/delivery/to_confirm preference ("I need guidance"). Delivery requires one 1-500 character trimmed address; an optional 500-character note uses `customer_note`.
- Accessible fields/errors, focused feedback, pending/duplicate-click handling and retry. Tab-scoped sessionStorage retains drafts and unresolved payloads; accepted receipts replace contact data. Basket contents are retained.
- Zod validation, bounded JSON parsing, HMAC fingerprinting and response mapping in the API route. It uses the publishable/anon key, never a service-role key.
- One anonymous SECURITY DEFINER RPC with empty search_path and schema-qualified table references. Execute is revoked from PUBLIC/authenticated/service_role and granted to anon. Public table inserts stay closed; private retry/limit tables remain inaccessible to public roles.
- New customer per request; atomic customer/order/current item snapshots/initial submitted event. No phone deduplication, accounts, payments, reservations, stock decrement or inventory adjustment.
- Unique `order_requests.idempotency_key` and constrained `delivery_address` snapshot. Matching key/fingerprint/database-computed payload hash returns the original receipt; altered input conflicts and concurrent retries cannot duplicate records.
- Reference generation is included: `ZF-YYYYMMDD-XXXXXX`, Lagos date, six suffix characters excluding 0/O/1/I/L and up to ten unique-reference collision retries.
- Current published available/limited products in published categories supply snapshot names/prices/units. Client expected values only detect stale views. Quantities must satisfy current minimum/step rules and technical bounds; stock is not guaranteed.

Applied migrations now also include:

- `20260917020818_order_request_boundary.sql` (unchanged).
- `20260917152116_complete_public_order_request.sql` (forward correction, matching live history).

`src/types/database.ts` was regenerated from live Supabase after the correction.

### Abuse, environment and retry trade-offs

Database-backed limits allow 30 new attempts/minute globally and 5 per phone/15 minutes; accepted matching retries bypass those counters. The RPC computes phone/payload hashes itself: direct anon callers cannot defeat the limits by changing supplied HMAC arguments. The API HMAC is not authorization. A short global transaction lock coordinates requests. A distributed attacker can exhaust the global budget; stronger operational edge/bot protection remains a possible follow-up. Private rate records contain no raw phone/IP data.

The route needs a stable server-only `ORDER_REQUEST_HASH_SECRET` and the existing public Supabase URL/key. Missing configuration fails closed with 503; preserve the secret across deployments for pending retries. It still needs deployment configuration before route submissions can be enabled. No service-role key is required for ordering.

Session recovery survives reloads but ends when the tab is closed. Submitted records remain in Postgres. Unknown outcomes retain the original payload/key even if the basket changes later. The accepted-reference status is deliberately inline; the WhatsApp handoff and polished confirmation screen are the next increment.

### Verification and reproduction

- All 28 Vitest tests passed, including component checks and real isolated PostgreSQL transaction/concurrency tests with `ORDER_TEST_DATABASE_URL`. Forced reference collision, delivery constraints, immutable snapshots and retry behavior ran against Postgres.
- `npm run lint` and `npm run build` passed.
- Real Chromium browser checks at 360x800, 768x1024 and 1440x900: progressive navigation, conditional address, validation, retained values on back navigation, full-height mobile scrolling, visible feedback and sticky action, and the actual route 503/retry state. Screenshots were visually inspected; no uncaught browser errors were reported. Successful creation was verified in local DB integration tests, not by inserting production test orders.
- Live Supabase security/performance advisors: expected [anon-executable definer RPC warning](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable); INFO notices for private RLS tables with no policies and unused indexes. No public access was opened to silence these notices.
- Node 20 emits a Supabase deprecation warning; use a supported newer Node runtime in deployment.

For DB tests, set `ORDER_TEST_DATABASE_URL` to a local PostgreSQL admin connection, with `psql` on PATH or `PSQL_BIN` configured. The suite creates a unique database, bootstraps minimal Supabase roles/auth schema, applies all committed migrations, tests and drops only its database. Without the variable, DB tests explicitly skip. This harness does not emulate the entire hosted Supabase stack.

## Exact next task for review

Review the request contract, forward migration, anonymous grants/rate limits, immutable snapshots, conditional address, reference collision handling and retry/drawer tests. After approval, implement the configured WhatsApp message/handoff and truthful confirmation/next-step experience. Payments, reservations, customer accounts and staff-dashboard work remain outside this increment.

## Information still intentionally unresolved

- Final WhatsApp business number/environment value.
- Exact reservation duration and when a reservation begins.
- Final delivery/pickup areas, fees and operational responsibility.
- Final staff members and permission assignments.
- Final programme fields, schedules, pricing and notification sender configuration.
- Final production copy, policies, photography and logo assets.
- Whether all wholesale rules supplied remain current at launch.

Represent unresolved operational values as safe configuration/admin content only when doing so is useful now. Do not fabricate them.

## New-session startup checklist

1. Read `AGENTS.md` and this file.
2. Inspect `git status`, current branch and recent commits.
3. Inspect the code and migrations related to the requested task.
4. Read relevant local Next.js 16 docs.
5. Confirm whether this AI is the implementer or reviewer for the task.
6. Keep the change within the named milestone.
7. Verify, commit and hand off with concrete evidence.
