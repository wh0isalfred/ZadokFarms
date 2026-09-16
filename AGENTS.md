<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Zadok Farm — Agent Operating Contract

This file is the shared instruction set for every AI or human contributor. `CLAUDE.md` imports it. Read it completely before changing the project.

## 1. Product definition

Zadok Farm is one connected product:

- a public, mobile-first farm website;
- a produce catalogue and basket that creates order requests;
- a private operational workspace for approved staff;
- training registration/application;
- agricultural service enquiries;
- light operational visibility for products, orders, customers, stock and harvests.

The public experience must feel like a real working Nigerian farm: grounded, capable, human and alive. It must not collapse into a generic grocery store, generic SaaS dashboard or decorative editorial website.

Use **Zadok Farm** in public copy unless the stakeholder-approved logo requires another lockup. The parent organisation is Zadok Foundation, but the farm must have its own green/black identity.

## 2. Instruction and truth hierarchy

When instructions conflict, use this order:

1. The user's latest explicit instruction.
2. Approved requirements in `docs/PROJECT_HANDOFF.md`.
3. This file.
4. Existing database migrations and production behaviour.
5. The current interface and codebase.
6. Design transcripts and references supplied by the user.

Design transcripts provide principles, not permission to invent features or overwrite approved business rules. A later explicit decision supersedes an earlier one. Record material new decisions in `docs/PROJECT_HANDOFF.md` in the same change.

## 3. Before changing code

For a non-trivial task:

1. Inspect the relevant routes, components, styles, migrations and types.
2. Read the relevant local Next.js 16 guide in `node_modules/next/dist/docs/` before relying on framework memory.
3. State the intended approach, meaningful trade-offs and important edge cases briefly.
4. Check the working tree. Preserve unrelated user changes.
5. Ask a question only when the missing answer would materially change the result, business rule, schema or visual direction. Do not re-ask settled questions.

Do not begin by rewriting working areas outside the requested scope.

## 4. Locked first-release scope

### Public website

- Shop/produce catalogue
- Basket and order request
- Training programme discovery and registration/application
- Greenhouse construction enquiries
- Agricultural consulting enquiries
- Our Farm, About, contact/visit and WhatsApp paths
- Real farm photography, gallery/storytelling and operational credibility

### Staff workspace

- Staff authentication; no customer authentication
- Simple roles: owner/admin/staff, with permissions controlled by the system
- Product/category publishing and availability management
- Order request review and status management
- Customer records needed for fulfilment and legitimate relationship management
- Append-only stock/harvest adjustments and traceability
- Training programme and application management
- Service enquiry management
- Relevant content and staff permission management

### Explicitly outside first release

- Customer accounts
- Online produce payment or payment gateway
- Full accounting/bookkeeping/ERP
- Delivery fleet/route management
- Learning management system or online course delivery
- Certificates or starter-pack fulfilment
- General-purpose page builder
- Complex enterprise RBAC
- AI support bot
- Silent background actions that commit stock or payment-sensitive changes while offline

Do not add an attractive “future feature” without explicit approval.

## 5. Produce order workflow — do not reinterpret

1. A customer shops without creating an account.
2. The basket may persist on that device for convenience.
3. Submission creates a server-side customer/order request and unique Zadok reference.
4. The site prepares a clear WhatsApp message containing the reference and order summary.
5. The customer sends it to Zadok through WhatsApp.
6. Zadok staff verify real availability.
7. Zadok shares account/payment details through WhatsApp only after confirming the order.
8. Staff manually confirm payment in the system.
9. Delivery or pickup is arranged operationally.
10. The system retains a traceable status history.

The website must distinguish at least requested/submitted, confirmed, paid, fulfilled and cancelled outcomes. The database may use more precise intermediate states where already approved.

Never present basket submission as a completed purchase. Never tell a customer to pay before Zadok confirms availability. Reservation duration is configurable; do not hardcode one hour, five hours or 24 hours without an approved operational rule.

Wholesale operating windows, pickup windows, delivery policy and perishable holding rules are business configuration/content, not constants buried in components.

## 6. Training and services

Training is registration/application, not online course delivery.

- Staff can create, edit, publish, archive and duplicate programmes.
- A programme owns its delivery options and configurable fields/options.
- Applicants choose from the options actually configured for that programme.
- Staff review/approve applications and trigger the appropriate follow-up email.
- Attendance, teaching, certificates and starter packs remain outside the website unless later approved.
- Archive retained programmes/data; delete only unused drafts when safe.

Greenhouse construction and consulting begin as distinct service enquiries. Collect only information needed for a useful response. Quotation, calls, meetings, site visits and physical delivery continue outside the website unless later approved.

## 7. Data and inventory invariants

- Supabase Postgres is the source of truth for orders, customers, products, staff, training and enquiries.
- Browser storage is never the only copy of an actual submitted order or customer record.
- Every schema change must be a committed migration in `supabase/migrations/`; do not edit the live schema manually.
- Regenerate `src/types/database.ts` after schema changes.
- Enforce constraints and foreign keys in Postgres as well as validation at application boundaries.
- Use RLS on exposed tables. A hidden UI is not authorization.
- Preserve the append-only inventory ledger. Never replace it with a mutable “current stock” field.
- Stock is derived from adjustment events such as harvest, reservation, release, fulfilment, spoilage, correction and physical count.
- Never rewrite or delete ledger history to “fix” a balance; append a traceable correction.
- Inventory/order mutations must be idempotent where retries or offline sync can occur.
- Avoid N+1 data access and add indexes based on real query patterns.
- Never expose a Supabase secret/service-role key to the browser or a `NEXT_PUBLIC_` variable.

## 8. Offline and low-connectivity behaviour

Design for unstable mobile connections without pretending every action can be safely offline.

- Safe drafts and explicitly queueable events may be retained locally.
- Show pending, syncing, failed and conflict states clearly.
- A retry must not duplicate an order or stock event.
- Live availability checks, reservations, permissions, payment confirmation and stock-sensitive final actions require connectivity.
- Never claim success until the server has accepted the action.

## 9. Design system and UX guardrails

### Emotional direction

The experience should communicate trust, competence, growth and human connection. Zadok's pillars are leadership, integrity/faithfulness, exploration/innovation and community.

### Palette hierarchy

- Surface cream `#F7F0E3`: primary world/background
- Leadership near-black `#11120F`: typography, navigation, primary actions, footer
- Integrity deep green `#1D5134`: identity, active states, availability, substantial farm moments
- Innovation sage `#8DA68B`: field-line graphics, secondary surfaces and restrained motion
- Community terracotta `#B95832`: people, limited stock and small attention cues
- Ground `#D8BA86`: warm agricultural/training distinction

Do not distribute all six colours equally. The interface remains primarily cream, near-black, deep green and photography. Terracotta is not the system error colour.

### Interface rules

- No large marketing hero before produce on the homepage. The product-first opening is intentional.
- Preserve generous whitespace, clear grouping, strong hierarchy and readable line lengths.
- Avoid excessive cards, pills, borders, underlines and boxed sections.
- Avoid generic gradients, glassmorphism, neon SaaS styling, childish farm motifs and template-like iconography.
- Use restrained field-line strips in strategic positions; they must remain visible on mobile and desktop without obstructing content.
- Real photography should carry much of the colour and emotion.
- Motion should reveal hierarchy and atmosphere, not delay tasks. Support `prefers-reduced-motion`.
- Desktop navigation is sticky. Mobile uses a bottom navigation plus an accessible top-right basket; do not add a second sticky top navigation without approval.
- Use descriptive actions such as “Add to basket,” “View training programmes” and “Request bulk supply.” Do not make users decode ambiguous labels.
- Maintain accessible focus, contrast, semantic structure, keyboard operation and minimum touch targets.
- Do not change approved public visual sections merely because a different pattern is fashionable.

## 10. Engineering rules

- Next.js 16 App Router, React 19, TypeScript strict mode and Supabase are the approved foundation.
- Prefer Server Components for initial data and content. Add `"use client"` only at the smallest interactive boundary.
- Keep presentation, validation/business rules and data access separate when the separation adds clarity.
- Validate all external input with Zod or equivalent at the boundary.
- Do not introduce `any`. Narrow `unknown` safely.
- Use Server Actions or route handlers deliberately; protected mutations must perform server-side auth and authorization.
- Use native/platform capabilities before adding a dependency. Explain any material dependency.
- Do not introduce React Query, SWR, Zustand, Redux or another state layer until the actual access pattern requires it.
- Keep client state local. Compute derived values instead of storing duplicates.
- Errors must be useful to users and diagnosable by maintainers without leaking secrets.
- Use optimized images with accurate sizes and meaningful alt text.
- Avoid premature abstractions, speculative config systems and “enterprise” patterns unsupported by the scope.
- Do not leave placeholder logic, fake success paths or unresolved TODOs in a completed feature.
- Comments explain non-obvious reasons/invariants, not the syntax.

## 11. Verification and completion

A feature is not complete because it renders once.

- Add focused unit tests for meaningful business rules.
- Add integration coverage for mutation boundaries and at least one relevant failure case.
- Verify responsive behaviour at narrow mobile, wider mobile/tablet and desktop widths.
- Exercise loading, empty, error, offline/retry and long-content states when relevant.
- Run `npm run lint` and `npm run build` before handoff.
- Run applicable tests and Supabase security/performance advisors after database changes.
- Inspect the actual rendered result when visual behaviour changed.
- Report exactly what was verified and any limitation; never claim a check you did not perform.

## 12. Git and two-agent collaboration

Codex and Claude must not independently edit the same task at the same time.

- Assign one **implementer** and one **reviewer** for each task.
- The implementer owns the branch and makes the change.
- The reviewer receives the task brief plus commit/diff, then reports concrete defects or approves it.
- The implementer applies accepted review findings and re-verifies.
- Transfer work through committed Git changes, never pasted partial files or uncommitted assumptions.
- Before starting: fetch, inspect the branch and confirm a clean working tree.
- Prefer small, coherent commits with human present-tense messages.
- Do not amend, rebase, force-push, reset, discard or overwrite another contributor's work without explicit permission.
- Do not commit secrets, `.env.local`, generated build output or unrelated formatting churn.
- Push or merge only when the user requests it or the agreed task includes it.

Every handoff must state: branch/commit, files changed, migrations, environment changes, verification completed, known limitations and the precise next step.

## 13. Behaviour when uncertain

Do not invent business facts, copy, prices, policies, farm statistics or stakeholder decisions. If a missing fact can be represented safely as admin-managed content/configuration, build the capability without fabricating the value. If it changes money, stock, permissions, legal/privacy handling or the customer promise, stop and ask.
