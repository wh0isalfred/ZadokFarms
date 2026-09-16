# Zadok Farm — Project Handoff and Current State

Last updated: 16 September 2026

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

## Latest completed milestone

Remote `main` currently ends at:

- `fefc92a fix: publish complete Supabase foundation files`

Verification completed for that milestone:

- `npm run lint`
- `npm run build`
- production server/runtime HTML smoke check
- live catalogue query
- Supabase security advisors with no security findings

The remaining “unused index” performance notices were expected on a newly created database with no workload.

## Next approved milestone

Build the first complete customer ordering vertical slice:

1. Reliable device-local basket persistence.
2. Accessible basket drawer/page behaviour for mobile and desktop.
3. Minimal customer and fulfilment details form.
4. Boundary validation and abuse/rate-limit strategy for the public mutation.
5. Atomic server-side creation of customer, order and item snapshots.
6. Collision-safe human-readable Zadok order reference.
7. Tailored, encoded WhatsApp message and explicit handoff.
8. Confirmation/next-step state that clearly says availability and payment are not yet confirmed.
9. Failure, retry and idempotency behaviour.
10. Focused tests and responsive verification.

Do not start the staff dashboard until this vertical slice is designed and implemented cleanly, unless the user explicitly changes the priority.

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
