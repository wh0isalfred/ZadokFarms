# Approved order-request UX plan

Approved in the Product/UX review on 18 September 2026; Increment A + B authorised for implementation afterward. The review inspected main at `179ae6c0d90bb99db5aaa4b1701835e9215361bf`.

The original design/motion transcript was unavailable among accessible attachments and repository files. This plan uses the recorded principles in AGENTS.md and PROJECT_HANDOFF.md: grounded, capable, human, spacious; cream/near-black/deep-green hierarchy; restrained motion; product-first shopping; no generic checkout or SaaS styling.

## Scope and invariants

This is an order request, not a completed purchase. Preserve the existing server route, RPC, validation, field names, enum values, conditional delivery address, snapshot authority, idempotency and uncertain-outcome retries. No migrations, generated type changes, new dependencies, customer accounts, payment, reservation or inventory work.

A + B implements the UI and its verification only. Maps, geocoding, coordinates, delivery zones, provider APIs, location persistence, WhatsApp handoff and polished confirmation remain separate future increments. No coverage, fee or ETA promises.

## Findings and intended hierarchy

The original details step removed order context, hid fulfilment inside a select, gave every field the same weight and placed a long explanation before the task. Its sticky action overlapped the visible delivery address on mobile; desktop repeated the narrow 440px form.

Keep one progressive drawer. Use a stable header, one scrolling body and a separate action footer that reserves layout space. Mobile is full-height; tablet/desktop use a focused 560px right-side panel. Desktop contact fields may sit side by side, without turning the flow into a two-column checkout.

Details content order:

1. Back to basket, Request details title, Close.
2. Compact produce summary: line count, estimated produce subtotal, View items, Edit basket.
3. Your contact details: full name, WhatsApp number with country code.
4. Fulfilment choices, using native radios inside a fieldset/legend.
5. One required address textarea for Delivery, with the existing helper and 500-character limit.
6. Optional note, visually secondary. The approved design allows a disclosure; A retains a short visible field to preserve predictable field/error access.
7. Purposeful feedback and a short tab-draft explanation.
8. Footer: availability/payment explanation and Submit request.

Normal summary uses current basket props; unresolved retries use the immutable saved attempt's quantities, names, prices and units. Recorded receipts use returned item snapshots. Edit basket returns to review and preserves contact values. Do not present the estimate as staff-confirmed stock or an amount due.

## Fulfilment choices

Only these decisions are styled as grounded choice cards. Contact fields remain open and unboxed. Use cream surfaces, subtle borders, deep-green checked state and a visible native radio; selection and focus must not rely only on colour.

- Pickup (`pickup`): I'd prefer to collect. Zadok will confirm arrangements.
- Delivery (`delivery`): I'd prefer delivery. Zadok will confirm whether it can be arranged.
- I need guidance (`to_confirm`): I'd like help deciding between pickup and delivery.

Preserve the existing default and restored selection. Keep radio keyboard behaviour, associated descriptions, visible labels and 44px minimum label targets. Switching away from Delivery hides the address while preserving the editable draft; the unchanged request schema strips it from non-delivery submissions.

## Exact current interactions

- Basket review -> Continue to request details -> Request details -> Submit request -> existing inline server receipt.
- Back/Edit basket preserves values and returns to review. Close/Escape restores the opener.
- Entering details adds one same-document history entry, retaining Next's state. First browser/hardware Back returns to review; another Back navigates normally. UI Back, Close and empty-basket resets consume the details entry rather than stacking entries. Forward can restore details only while the basket is open and nonempty.
- Empty basket returns to review. Existing saved-attempt storage is not erased by basket editing.
- While pending, prevent duplicate submissions and editing; closing does not mean cancellation. An unknown outcome preserves the original payload/key and offers Retry saved request.
- Field validation retains native semantics, associated inline errors and focused feedback. Footer/content must not overlap at any scroll position.
- A definitive `key_conflict` gets an explicit Clear saved retry and review details action. It replaces only that unresolved retry with a safe editable draft, preserves unrelated storage, explains that no previous request is cancelled, and generates a new key only on the next submission. Never offer this reset merely for a timeout or unknown result.
- Rate-limit feedback says wait up to 15 minutes. The fixed Retry-After header is not an exact live countdown. The server response contract remains unchanged.
- Preserve reduced-motion rules. Step focus, not decorative motion, communicates progression.

## Component responsibilities

- BasketDrawer: modal shell, focus, review editing, header and step navigation.
- useRequestStep: one details history entry and Back/Forward handling.
- OrderRequestForm: existing draft, validation, attempt, receipt and submission lifecycle; grouped body and action footer.
- RequestSummary: current basket, saved attempt or recorded receipt projection.
- FulfilmentChoices: native radio group.

No speculative location component or provider abstraction is shipped in A.

## Future location selection (design only)

Delivery gets a location substep from Request details. Pickup/guidance skip it. The substep replaces the drawer body, never stacks another modal. Search/results precede a bounded map preview; manual entry is always available. Confirming a location returns to details and does not submit the request.

1. Search address or place; Use my current location; Enter address manually.
2. Selecting a result previews its place/area and optional pin. A result is not yet confirmed and is not proof of a deliverable address.
3. Ask browser permission only after an intentional current-location action and explanation. Use one-time lookup, not tracking. Poor accuracy, denial and timeout retain manual fallback.
4. Let customers verify the candidate and complete building/street/area/city/state/landmark in the existing address textarea. Pin dragging must not be required.
5. Use this location / Use this address returns a confirmed draft selection to Request details. Back retains the previous confirmed selection. Change location reopens the substep.
6. Never infer coverage, fees, distance-based eligibility or arrival time from a pin.

Future minimum requirements, subject to approval: required address snapshot; optional validated latitude/longitude pair; source/provenance and relevant accuracy; bounded cancellable place search and result resolution; optional reverse lookup; explicit privacy/access/retention decisions. Manual-only requests have no coordinates. Provider IDs/raw payloads are not minimum business data. If location is persisted, include it atomically with the request and in the idempotency comparison; never attach it after creation. No implementation or schema is authorised here.

## Future confirmation (design only)

After a valid server receipt, replace the form with Request recorded, the reference and accepted item snapshots. Availability, fulfilment and payment remain unconfirmed. Location confirmation, a spinner, or a network timeout cannot imply request acceptance. WhatsApp handoff is a separately approved follow-on.

## Stakeholder questions and sequencing

Use STAKEHOLDER_QUESTION_BANK.md for actual operations: useful address/pin information, manual fallback, who decides delivery eligibility and fees, inaccurate locations, approved pickup details, address corrections after submission, location access/retention and realistic response expectations. Do not ask stakeholders to choose software providers or database fields.

A: hierarchy, summary, radio choices, responsive shell, existing-state copy and explicitly requested recovery/navigation improvements; no contract changes.
B: regression tests plus real mobile/tablet/desktop verification of keyboard/focus, long content, empty basket, footer clearance, validation, pending, Back, conflict, rate limit and retries.
C (later): validate location interactions with a non-production prototype.
D (later): only after operational/privacy decisions, approve provider/API/schema work separately.
E (later): dedicated recorded-request receipt and separately authorised WhatsApp handoff.

A + B acceptance: existing tests remain a regression gate; new tests cover summary source, radio selection, action-region structure, history, explicit conflict recovery and rate-limit messaging. Real-browser geometry complements DOM tests; DOM tests alone cannot prove footer clearance. Do not claim hardware keyboard, assistive-technology or production-order checks unless performed.
