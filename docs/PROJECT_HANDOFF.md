# Zadok Farm — Project Handoff and Current State

Last updated: 20 September 2026

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

The catalogue is seeded with the nine concept products and reads from Supabase server-side. Static concept prices are no longer used as a runtime fallback; see the catalogue freshness increment below.

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

## Public catalogue rendering and freshness increment

Implemented on `perf/public-catalogue`, based on request-boundary commit `13e631d477970de3d774df308b75fae62769ddde`. At task start, fetched `origin/main` remained `d1c8002a209ae0309820b4c812c1b1d9c9bcfb38`, three commits behind that base. The order-request contract, API, migrations and generated types are unchanged.

- `src/lib/supabase/catalogue.ts` creates a cookie-free publishable-key client with session persistence/refresh/URL detection disabled. Its fetch explicitly uses `no-store`. `server.ts` remains the separate cookie-aware client for future staff/auth work.
- The homepage explicitly stays dynamic, including when configuration is missing. Removing `cookies()` alone would not establish freshness: Next.js 16's default fetch can run at build-time on a prerendered route. No shared data cache, ISR TTL, Cache Components migration or staff invalidation endpoint was added.
- `loading.tsx` streams a small accessible loading state while the current catalogue read completes. This improves initial feedback, not database latency. Published-product filters and selected fields remain unchanged.
- Missing configuration or a failed query displays an unavailable message and a full-document reload form. It does not show concept prices or mount an empty basket, preserving device basket data through outages. A successful empty query has distinct empty-catalogue copy. Streaming may already have sent HTTP 200 before an error result arrives.
- A committed catalogue update becomes visible on the next successful server read after that commit, without redeployment or TTL delay. There is no stale-while-revalidate response or retained last-good result. Supabase's built-in transient GET retries still apply. An already-open page, browser history restoration or reused client navigation remains a snapshot until a new server render/full reload; no polling or automatic background refresh was introduced. Updates racing an in-flight read can require another reload.
- The visible notice now explains that prices/availability may change and Zadok confirms fulfilment/payment afterward, including on mobile. The unchanged order RPC revalidates current published/requestable products, quantities and expected values and resolves current snapshots. Displayed availability never guarantees stock or fulfilment.

### Evidence and reproduction

Measurements used local production `next build` / `next start`, real `.env` Supabase URL/publishable key and nine live catalogue products. They are local samples, not deployment/CDN benchmarks:

- Baseline build: `/` dynamic; no homepage entry in the prerender manifest. Five sequential GETs: cold TTFB/full response 3.839/3.842 seconds; warm TTFB 264-351 ms and full responses 265-352 ms.
- Changed build: `/` still dynamic, absent from the prerender manifest. Initial comparison: warm TTFB 33-59 ms, full responses 276-400 ms. Final-build five-GET sample after browser checks: TTFB 43/29/33/28/23 ms, full responses 1848/324/345/360/252 ms. The variation reinforces that streaming does not eliminate upstream latency.
- Both versions returned `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`. Temporary process-level fetch instrumentation counted one real Supabase catalogue read per successful document request, including repeated requests. No credentials were logged; instrumentation is outside the repository.
- `npm run lint` and `npm run build` passed. All 31 tests passed with `ORDER_TEST_DATABASE_URL` set, including the existing 11 isolated local PostgreSQL tests. Three new catalogue tests exercise the real Supabase client against mocked HTTP responses: explicit no-store/no cookie, publication filters, successive price/unit/status changes, error recovery and empty/missing-configuration behavior. These catalogue tests are not hosted database integration coverage.
- Real Chromium checks of the final build at 360x800, 768x1024 and 1440x900; screenshots visually inspected. Verified current nine-product rendering and readable freshness notice. No uncaught browser errors were reported.
- Temporary local upstream response interception verified: an open page retained Habanero's original 4500/available snapshot; a full reload showed simulated 5000/unavailable and removed its add action; restoring live responses restored 4500/available. Also verified an empty result, failure/reload recovery, retained basket quantity through failure, and visible loading feedback under an injected three-second delay. No production products or orders were mutated.

No dependency, database schema or environment contract changes. Node 20 still emits the existing Supabase deprecation warning. The catalogue needs the existing real public environment variables to display products. Cross-request caching should be reconsidered only with an approved freshness window or a staff update path that reliably invalidates it. Review this increment separately from the request-boundary base; WhatsApp handoff remains outside this work.

## Order-request UX Increment A + B

Implemented on `feat/request-ux` from main `179ae6c0d90bb99db5aaa4b1701835e9215361bf`. The durable approved plan is [ORDER_REQUEST_UX_PLAN.md](ORDER_REQUEST_UX_PLAN.md). The original design/motion transcript remained unavailable; implementation follows the approved conversation plan and brand principles recorded here and in AGENTS.md.

- Request details now groups contact fields, shows a compact expandable/editable produce summary and uses native radio choice cards for Pickup, Delivery and I need guidance. Existing values/default and conditional address validation are preserved. Ordinary fields remain unboxed; only fulfilment choices are cards.
- Normal summaries use the current basket. Unresolved attempts use their immutable saved item data, regardless of later basket edits; accepted summaries use server receipt items. Estimates never imply staff-confirmed availability or payment.
- Full-height mobile layout and a 560px tablet/desktop drawer have a stable header, scrolling body and separate action footer. The footer reserves layout space; trailing content has scroll clearance. Desktop contact fields use the additional width. Reduced-motion rules remain in place.
- One same-document details history entry preserves Next's history state. First browser Back returns to basket review; subsequent Back proceeds normally. Edit/Back/Close consume the details entry; repeated navigation does not accumulate entries. Forward after closing does not force another traversal or reopen the drawer. Empty basket returns to review without erasing existing retry storage.
- Only an explicit server `key_conflict` enables Clear saved retry and review details. This replaces that unresolved attempt with its editable details, leaves unrelated storage alone and creates a new key only on the next submit. The explanation states that this does not cancel a previously recorded request. Timeouts/unknown outcomes still retain and retry the exact original payload/key.
- Rate-limit UI says "wait up to 15 minutes", with no countdown based on the fixed Retry-After header. No server response, route, contract, RPC, migration or database-type change.
- The two approved pickup-publication/address-correction questions were added to the later operational section of STAKEHOLDER_QUESTION_BANK.md. No business answers were invented.

### Verification for this increment

- ESLint and the production Next build passed. Final verification used installed CLI entrypoints (`node node_modules/eslint/bin/eslint.js`, `node node_modules/next/dist/bin/next build`) after Windows npm/CLI shims became unavailable; the project scripts were not changed. The existing Node 20 Supabase deprecation warning remains.
- All 40 Vitest tests passed, including all 11 actual isolated local PostgreSQL regression tests after restarting the local test server. Nine added UI/history tests cover live/saved summary source, native radios, separate action structure, Back/repeated navigation/Forward after close, conflict recovery and rate-limit wording. Existing test scenarios remain; select-specific interactions were updated for radios and the new continue label.
- Real Chromium production-build checks with real catalogue environment variables at 360x800, 768x1024 and 1440x900. Screenshots were visually inspected. Additional 320x640 eight-line basket and 360x500 short-viewport checks passed. Measured footer/body bounds did not overlap; the last content retained approximately 32px clearance above the scrolling body's end.
- Browser checks passed for delivery validation/focused feedback, native radio arrow keys, reverse-Tab containment, Escape focus restoration, native Back then normal navigation, repeated Edit/continue without extra entries, and reduced-motion preference. Long address/note content remained scrollable.
- Browser-local API interception verified pending close/reopen, unchanged retry payload after basket edits, explicit conflict recovery/new key, rate-limit feedback and accepted-receipt recovery. No production requests/orders were created. Actual atomic submission correctness is covered by the separate existing local PostgreSQL tests, not these intercepted browser responses.
- No uncaught browser errors in the complete final flow. The initially used agent-browser executable became unavailable; remaining checks used a temporary Playwright driver with already-installed Chromium, outside the repository. No project dependency or environment contract changed.
- Limitations: desktop Chromium viewport/keyboard automation is not physical mobile hardware, a real software keyboard, or a screen-reader audit. Location, WhatsApp handoff and a polished receipt remain unimplemented.

## Upper catalogue visual increment

Implemented on `feat/catalogue-opening` from current main `b61a6da6c83d22e40ac54032afcb6c86a04b0fcd`.

- Provenance is visible at every width, followed by a stronger heading, the existing truthful freshness line, then controls and photography. Categories expose their selected state with `aria-pressed` and have 44px targets. Desktop controls remain grouped on the right; tablet controls wrap and mobile categories scroll horizontally.
- Catalogue entries retain their data/actions and use consistent 4:3 photos, modest radii, wrapping names and aligned full-width actions. Quantity controls use deep green. The artwork behind the opening was removed; lower field-line artwork and all lower homepage sections remain unchanged.
- Changed files: `src/components/storefront.tsx`, `src/app/globals.css`, `tests/catalogue-ui.test.tsx`, and this document. No ordering, Supabase, migration, generated-type, dependency or environment changes.
- ESLint and production Next build passed via installed Node CLI entrypoints (Windows npm shims remain unavailable). Homepage remains dynamic with real catalogue environment variables. All 41 tests passed, including the 11 isolated local PostgreSQL regression tests; the new UI test covers content order, selected category semantics and preserved unavailable/limited states.
- Actual Chromium production-build checks at 320x900, 360x900, 768x900 and 1440x900: nine live products, content/controls/grid order, no horizontal overflow, keyboard category activation/focus outline, category filtering, unavailable action, add/decrease and 44px quantity targets. Screenshots inspected at mobile, tablet and desktop. A delayed-image check at 360x800 confirmed unchanged image bounds before/after loading. Browser-local long-name text injection verified wrapping without action overlap at all four widths; this was a layout stress check, not a production data change. No uncaught browser errors.
- Limitations: viewport automation is not a physical-device or screen-reader audit. Existing availability/sort buttons remain non-functional placeholders; no new filtering behavior was introduced. Existing 768px header spacing is tight and unchanged because navigation is outside scope. Existing photography is retained, including its source-resolution limitations.

## Exact next task for review

Review the bounded Shop improvements documented at the end of this file, based on the original main UI. The earlier broad visual redesign branch is superseded. Staff Auth provisioning and WhatsApp deployment configuration remain covered by their existing runbooks.

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

## Basket and request-form refinement — 19 September 2026

Implemented on `feat/basket-request-refinement` from fetched main `db96b29`. UI and client validation only; no Supabase, migration, generated type, route/RPC, idempotency, WhatsApp, location, payment, stock, account or lower-homepage changes. No dependency or environment changes.

- Client validation renders the approved inline copy, scrolls only the request body and focuses the first invalid visible field in contact/address order. The offset reserves space for the inline error on short screens. Correcting a field clears only its own error; leaving Delivery removes its inapplicable address error while retaining the draft. The valid default/restored native radio selection cannot be missing. Existing schema rules remain authoritative.
- Focus and associated descriptions announce field errors without additional live alerts. The generic bottom client-validation message is removed; whole-request feedback and recovery remain intact.
- Basket rows use existing product imagery with fixed 64px thumbnails, readable unit prices, labelled 44px quantity controls, polite quantity output and line estimates. Rows remain unboxed.
- Both action shelves remain siblings of scrolling content, with subtle dividers, 24px space above their primary buttons and 20px bottom padding plus the safe-area inset. Fields use warm surfaces and visible focus; the optional note stays visible and secondary. Current, saved-attempt and receipt summary sources are unchanged.

Verification: `npm.cmd run lint` and `npm.cmd run build` passed. `npm.cmd test`: 33 passed; 11 isolated database tests skipped because `ORDER_TEST_DATABASE_URL` was not configured. Independent review identified and resolved combined basket/contact validation stealing field focus; a regression and production-browser check at all four sizes now cover it. New tests cover ordered field focus, correction isolation, approved copy, no generic bottom validation, imagery, quantity semantics and separate review actions. Existing retry, pending, key-conflict, saved summary, receipt, rate-limit and Back/Forward coverage passed.

Actual local production-build Chromium checks at 360x800, 768x1024, 1440x900 and 360x500 covered empty submission, sequential corrections, conditional address focus, keyboard quantity/radio controls and focus trapping, long product names, long address/note drafts and footer clearance. Images decoded successfully. Screenshots were inspected at mobile, tablet, desktop and short-mobile sizes. Browser interception covered pending close/reopen, immutable retries after basket edits, explicit conflict recovery/new key, rate limiting and a recorded receipt; no production requests were created. History Back and repeated Edit navigation were also checked. No uncaught browser errors were reported.

Limitations: browser viewport automation is not a physical-device, virtual-keyboard or screen-reader audit; nonzero device safe-area insets were not emulated. Database tests were not run in this increment. Browser submissions used intercepted responses, not live order creation. The original design transcript remains unavailable. The agent-browser launcher failed to establish its CDP connection, so verification used the existing local Playwright/Chromium harness without adding project dependencies.

Changed files: `src/components/basket-drawer.tsx`, `src/components/order-request-form.tsx`, `src/app/globals.css`, `tests/order-drawer.test.tsx`, and this handoff. Next step: review this refinement against main, then merge through the normal review process; no merge is included in this task.

## WhatsApp country calling-code input — 19 September 2026

Implemented on `feat/whatsapp-country-code` from reviewed refinement commit `5bcc453`. At task start, remote main was still `db96b29`; the requested current refined form was on `feat/basket-request-refinement`, so this branch preserves that approved work rather than reverting its field-focus behaviour. This task adds one commit above that base.

- Native labelled country select with Nigeria (+234) as default and all 245 geographic country/territory entries from a pinned Google libphonenumber metadata snapshot. No new package dependencies or runtime data requests. Source, Apache licence, coverage, refresh instructions and shared-code limitations are recorded in [CALLING_CODES.md](CALLING_CODES.md); the standard-library Python updater generates the checked-in subset.
- Separate WhatsApp national-number input uses tel type/input mode and tel-national autocomplete. Ordinary formatting and recognised national prefixes normalise to the existing international string. Italian significant zeroes remain; Nigeria, UK, North American, Russian, Argentine and Brazilian prefix cases have focused tests. Full international paste is accepted. The server schema remains the authority; no WhatsApp reachability claim is made.
- Existing international drafts restore into the two controls. New drafts preserve explicit country selection and typed formatting. Unknown legacy codes remain visible and intact. Shared calling codes cannot always identify a country; restoration uses leading-digit metadata or the main region while retaining every number digit.
- Saved unresolved attempts are display projections only: both controls lock and retries resend the original canonical payload and key. Existing validation order, local-number focus, error correction, conflict recovery and receipt behaviour remain intact.

Verification: `npm.cmd test` passed 52 tests, with 11 database tests skipped because no `ORDER_TEST_DATABASE_URL` was configured. `npm.cmd run lint` and `npm.cmd run build` passed. Actual local production Chromium checks at 360x800, 768x1024 and 1440x900 verified default/list completeness, native select keyboard operation, name-then-phone focus, Nigeria and UK submitted values, existing international draft restoration, byte-identical retry bodies after reload, disabled retry controls and action/body clearance. Screenshots inspected at all three sizes; no horizontal overflow or uncaught browser errors. Request responses were intercepted, so no production order was created.

No server/RPC/schema, migration, generated database type, API, environment, accounts, maps or WhatsApp handoff changes. Limitations: no physical mobile keyboard or screen-reader audit; database integration tests skipped; browser submissions mocked. Country-code metadata needs periodic reviewed refreshes. The existing Playwright/Chromium harness was used because the agent-browser launcher failed earlier in this session.

Changed files: request form, scoped form CSS, calling-code metadata, phone-input helper, metadata updater, source/licence documentation, phone helper/component tests and this handoff. Next step: review and merge the branch through the normal process; no merge is included.

## Recorded request and WhatsApp handoff — 19 September 2026

Merged into main as `adc843d` (implementation commit `08930cd` on `feat/recorded-whatsapp-handoff`, based on `d794fd9`). This completes the customer-facing confirmation/handoff milestone, subject to configuring the real business destination before deployment.

- A dedicated accessible drawer confirmation shows the recorded reference, server-returned item snapshots, quantities, line estimates, estimated subtotal, fulfilment preference and delivery address where applicable. Copy explicitly says availability, fulfilment and payment are not confirmed. It does not imply a purchase, reservation or payment.
- After RPC acceptance, the server enriches the receipt with fulfilment/address from the exact validated request payload bound by the existing idempotency fingerprint. Reference/items come from the RPC receipt. The server constructs the WhatsApp URL from this accepted data, never from the live basket. The normal `noopener noreferrer` link opens a new tab/window; the customer must send the prepared message themselves.
- New server-only configuration: `ZADOK_WHATSAPP_BUSINESS_NUMBER`. Set the registered business number as country code plus national number, 7–15 digits starting nonzero, optionally prefixed with `+`; spaces, parentheses and hyphens are accepted. Do not use a national leading zero, `00` prefix, extensions, URLs or `NEXT_PUBLIC_`. `.env.example` intentionally contains no destination value. Validation checks format, not registration or ownership. Missing/malformed configuration returns a successful receipt with no handoff URL.
- Session storage retains the accepted receipt and safe handoff URL across drawer close/reopen and page refresh, including an empty basket. It replaces the retry payload: no customer name, phone or retry key remains, but delivery address is retained for confirmation/handoff. Storage failures keep the in-memory reference visible with an honest warning. Start another request removes only the request-session entry and preserves the basket and unrelated storage; it does not cancel the recorded request.
- Legacy receipts still display their reference/items. Missing historical fulfilment/address/link cannot be regenerated locally and are stated as unavailable. A saved missing link remains unavailable after configuration changes until another server acceptance; there is no receipt lookup or background regeneration endpoint. Existing retry/key-conflict contracts and original retry payloads remain unchanged.

Verification: `npm.cmd test` passed 75 tests; 11 isolated database tests skipped because `ORDER_TEST_DATABASE_URL` was not configured. `npm.cmd run lint` and `npm.cmd run build` passed. Focused tests cover URL/message construction from accepted snapshots, missing/malformed configuration, rejection without a link, unsafe recovered URLs, truthful copy, accessible link attributes, persisted/legacy/empty-basket recovery, isolated reset and storage failures. Existing phone validation, immutable retry and history tests passed. Independent review caught a late overlapping retry response overwriting a newer request; a parent-owned generation guard now ignores stale success/rejection responses before storage or confirmation mutations. Two deferred-response regressions verify the new request remains intact.

Actual production-build Chromium checks passed at 360x800, 768x1024, 1440x900 and 360x500: no CTA before/pending acceptance, snapshot confirmation, close/reopen, refresh, Back/Forward, empty-basket recovery, start-another reset, missing configuration, keyboard focus containment, long content and footer clearance. At mobile/tablet/desktop the link opened a separate tab and redirected from wa.me to api.whatsapp.com; a reserved fictional test destination was used and no message was sent. Browser API responses were intercepted, so no production request was created. No horizontal overflow or uncaught browser errors. Screenshots were visually inspected.

Changed files: request form, basket drawer, new confirmation component, scoped CSS, order route/boundary, extended receipt validator, new server WhatsApp helper, boundary/drawer/handoff tests, `.env.example` and this document. No new dependencies, migrations, database types, RPC inputs or schema changes. The design/motion transcript remains unavailable; existing approved design guidance was used. Browser verification used the existing Playwright/Chromium harness because the agent-browser launcher failed earlier. Limitations: no physical-device, software-keyboard, screen-reader, live database or real registered WhatsApp account test. Next step: independent review, push this branch, then normal merge/deployment review and approved business-number configuration; deployment/merge are not part of this task.


## Staff access and read-only Orders foundation ? 20 September 2026

Implemented on `feat/staff-order-desk` from fetched main `adc843d`. The approved recorded-request/WhatsApp milestone is already included in that main base. No public ordering behavior was changed by this increment.

- `/staff/sign-in` starts Supabase email magic-link OTP with `shouldCreateUser: false`. The server callback exchanges a PKCE code using the browser's verifier; it accepts only a closed allow-list of internal order return paths. Responses do not disclose account/staff membership or provider details. Sign-out is a same-origin POST, attempts local provider revocation and clears only desk cookies even during an Auth outage.
- The new server-only `ZADOK_SITE_URL` is the exact trusted deployment origin for callbacks and POST origin checks. Staff sessions use HttpOnly, SameSite=Lax cookies scoped to `/staff`, Secure on HTTPS. Next Proxy refreshes cookies in both request and response; it is not the authorization boundary. Every list/detail read verifies `auth.getUser()` and a matching active `staff_profiles.id` using the publishable key and user's session, then queries through RLS. Missing/inactive/non-staff users get generic denial without order reads.
- Audited all existing migrations/helpers/policies/types. Customer, order, item and event SELECT policies already require `private.is_active_staff()`; profile reads allow self/admin with explicit active checking in application code. No migration or regenerated types were necessary. Existing write policies are unchanged; this feature adds no staff mutation endpoint or editing UI.
- Zadok Desk uses cream/ink/deep-green, a restrained desktop staff rail/header, identity/sign-out and Orders as the only work area. The bounded inbox shows 25 requests/page, mobile request rows, Lagos time, customer name, item-line count, estimate and fulfilment cue. Detail shows request customer contact, conditional address, note, immutable item snapshots and the submitted event. Empty, loading, unavailable and long-content states are explicit. No fake metrics or unbuilt navigation modules.
- All staff routes are dynamic; server fetches and staff HTTP responses are no-store. Explicit selected fields exclude internal notes, retry keys and current-product joins. Customer contact is not put in URLs, metadata, logs or local/session storage. Plain document navigation avoids retaining PII in Next's client router cache; history restoration conceals/reloads the previous protected document. The strict-origin referrer policy exposes only the origin, never paths or callback queries. Browser verification caught that no-referrer also suppresses the form Origin header; strict-origin preserves the CSRF check without leaking path/query data.
- [STAFF_AUTH_RUNBOOK.md](STAFF_AUTH_RUNBOOK.md) documents trusted origin, exact Supabase redirect allow-list, normal ConfirmationURL magic-link template, disabled signup, SMTP/rate limits, same-browser recovery and owner-only Auth-user/profile provisioning. Local Supabase signup is disabled in config; hosted Auth settings were not changed and no real accounts/emails were created.

Verification: 122 tests passed, including 18 real PostgreSQL transaction/RLS cases (the original 11 plus 7 staff-role/access cases), with no skips in the configured run. The default local service required unavailable credentials, so verification used an isolated temporary PostgreSQL 18 cluster on loopback port 55439 and the existing unique-database harness. The real tests applied every committed migration and verified anonymous/non-staff/inactive denial, active staff/admin/owner reads and deactivation. This is actual PostgreSQL RLS verification with a minimal test auth schema, not a hosted Auth/email test. Lint and production build passed; the build marks every staff route dynamic and includes no staff pages in the prerender manifest.

Actual Chromium production-build checks passed at 360x800, 768x1024 and 1440x900 using a local synthetic Supabase HTTP fixture. The real SSR SDK/cookie/callback path performed a PKCE challenge/verifier exchange against that fixture. Checks covered unauthenticated redirect without PII, active/inactive/non-staff access, no-store headers, 25-row pagination, detail snapshots/estimates/contact, long content, empty/error/missing/loading states, absent browser storage, sign-out and Back recovery. Screenshots of sign-in, inbox and details were visually inspected. No horizontal overflow or uncaught browser errors. Loading can begin an HTTP 200 stream before Next sends a data-free sign-in redirect; unauthorized customer data never renders. Additional browser checks verified anonymous RSC responses contain no customer data and are no-store, expired-session refresh writes a renewed HttpOnly cookie through the real SSR SDK/proxy, repeated reloads reach the upstream read, cross-origin sign-out is rejected, and invalid callback/return input recovers safely. No real email delivery, live staff account or production customer-data access was tested. Existing Playwright/Chromium tools were used because agent-browser is unavailable; no dependency added.

Changed files: new staff routes/layout/styles, presentation/privacy components, authorization/read/auth/security helpers and Proxy; existing Supabase server utility, local Auth config, scoped lint override for intentional document links, `.env.example`, four focused staff test files, existing database test suite, this handoff and the new runbook. No migrations, schema/type changes, order/inventory/payment mutations, maps, analytics, accounts or dependencies.

Limitations: the owner must complete hosted Auth/SMTP/redirect configuration and provision approved staff before rollout; real email/session behavior against the hosted project remains a deployment acceptance check. An already-open authorized view remains a snapshot until navigation/reload; there is no realtime revocation monitor, and previously viewed data cannot be withdrawn. Offset pagination can shift as requests arrive. Browser automation is not a physical-device/software-keyboard or screen-reader audit. Independent static security review approved the implementation with no blocking findings. The original design/motion transcript was unavailable; the locked task direction and repository design rules were followed. Next step: push the coherent feature commit, then normal merge/deployment review and owner-controlled setup. No merge or deployment is included.

## Original Shop baseline with bounded improvements - 20 September 2026

Implemented on `feat/shop-bounded-improvements` from fetched main `ab85498`. This supersedes the unmerged `feat/shop-reference-composition` proposal; that redesign is not included in this branch.

- Header/nav, heading hierarchy/copy, category styling, card/grid geometry, spacing, borders, buttons and all original image files remain main's versions. The previous harvest images and their replacement map are absent. Desktop remains four columns, tablet three, mobile two, exactly as main.
- Added only four finer, quiet pale sage diagonal bands behind the upper catalogue, with a visible mobile treatment. Decorative SVG is hidden from assistive technology and cannot intercept pointer events. Existing lower motifs are untouched.
- Available now is an accessible pressed-state toggle; default off preserves the full catalogue. On includes existing available/limited statuses and excludes unavailable. The native Sort control offers farm order (default), name A-Z and name Z-A. Supabase already orders by display_order; filtering/sorting operates on a derived array and never mutates the source or basket. Price/popularity/stock ordering is not offered. Controls combine with categories/search; View all/empty-result recovery reset all controls. Mobile exposes the same controls with 44px targets.
- Only the Seedlings Shop card's original concept image receives the versioned `seedlings-nursery.jpg`, with descriptive alt text. Custom Seedlings image paths remain authoritative. Original image files, basket thumbnails and lower-page imagery remain unchanged. [SEEDLINGS_IMAGE_PROVENANCE.md](SEEDLINGS_IMAGE_PROVENANCE.md) records the supplied reference, generated-image provenance and exact prompt. It is an illustration of nursery seedlings, not evidence of current Zadok stock.
- Changed files: storefront, product-card image selection, narrowly scoped globals.css additions, catalogue UI tests, one new image, this handoff and the seedling-only provenance document. No schema, migration, environment, dependency, fetcher, product-type/data, API/RPC, basket/request, staff or training changes.
- Verification: lint and production Next build passed. Windows npm shims became unavailable mid-run, so final checks used installed entrypoints (`node node_modules/eslint/bin/eslint.js`, `node node_modules/next/dist/bin/next build`, `node node_modules/vitest/vitest.mjs run`). Tests: 106 passed, 18 database cases skipped because no test database URL was configured. Focused cases cover combined availability/category/search, both name directions/default farm order, source immutability, empty/reset behavior, retained basket storage/quantities and Seedlings-only/custom-image handling.
- Actual production-build Chromium checks with nine live Supabase catalogue products at 360x800, 768x1024 and 1440x900 passed: no page overflow, four pointer-transparent bands, original first-four image URLs and rendered photographs, nursery image decoding, keyboard toggle/native select and focus outlines, combined controls, empty reset, basket storage unchanged by filters/recovered after reload, and navigation into the unchanged request form. Screenshots of all three widths and the mobile Seedlings state were visually inspected. Stale local Next image-cache variants from earlier work were cleared before final image verification. No uncaught browser errors; no real order submitted or production data changed.
- Limitations: original main's tight tablet header spacing and existing product-detail anchors are deliberately retained. Viewport automation is not physical-device or screen-reader testing. No database/RLS suite was run for this client presentation change. The nursery image is generated and should be replaced with approved farm photography when available.
- Next step: independent review and push this single bounded commit, then review/merge this branch in place of the superseded redesign proposal. No merge or deployment is included.
