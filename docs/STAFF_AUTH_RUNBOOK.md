# Zadok Desk: staff access setup

The desk is invite-only and read-only. `/staff/sign-in` requests an email magic link; `/staff/orders` and each detail request independently verify the Supabase user and matching **active** `staff_profiles.id`. Email text, user metadata and navigation visibility never authorize access.

## Deployment setup (project owner)

1. Set the existing Supabase project URL/publishable key and server-only `ZADOK_SITE_URL` to the exact HTTPS origin serving the desk (no path/query/fragment). Local development permits `http://localhost:3000` or `http://127.0.0.1:3000`. Use the same hostname throughout a sign-in flow.
2. In Supabase Auth, disable **Allow new users to sign up**. Keep anonymous sign-ins and unused auth providers disabled. The local `supabase/config.toml` disables both general and email signup; committing that file does not change hosted Auth settings.
3. Set Auth Site URL to that trusted origin. Add the exact redirect URL `<origin>/staff/auth/callback` to the redirect allow-list for each approved environment. Avoid wildcard production or arbitrary preview domains.
4. Use the normal Magic Link template with an anchor whose href is `{{ .ConfirmationURL }}`. The server SDK starts a PKCE flow; Supabase verifies the email link and redirects with a one-time `code`, which the callback exchanges using this browser's verifier cookie. A custom token-hash template is not supported by this callback. Open the newest link in the **same browser** that requested it. Expired/used links, email-scanner consumption and another browser require a fresh sign-in attempt.
5. Configure a trusted SMTP sender and Supabase Auth rate limits appropriate to the deployment. Provider errors, unknown accounts and throttling receive the same in-app “If this address can sign in…” response. This does not claim delivery or staff membership. Do not log email form bodies, cookies, callback codes or auth-provider response bodies in hosting/proxy tooling.
6. Verify with an owner-approved test identity before staff rollout: delivery, callback, session refresh, denied/inactive access, sign-out and browser Back. No real email delivery or account provisioning occurred during implementation.

## Owner-only provisioning

There is no account-creation route in the app. An authorized project owner performs provisioning in the Supabase dashboard or a trusted, temporary administration environment outside this repository/application:

1. Confirm the person's identity and authorized staff role privately. Create their Supabase Auth email user using the Dashboard's user administration or `auth.admin.createUser({ email: suppliedEmail, email_confirm: true })` in a trusted admin script. Confirm the address with the owner before marking it confirmed. A password is not required by the admin API. Never put the admin/service-role credential in this application or a `NEXT_PUBLIC_` variable; never commit the email, credential or script inputs.
2. Copy the returned Auth user UUID. Insert the matching staff profile using privileged owner SQL, substituting approved values in the dashboard only:

   ```sql
   insert into public.staff_profiles (id, full_name, role, active)
   values ('<AUTH_USER_UUID>'::uuid, '<APPROVED_STAFF_NAME>', 'staff', true);
   ```

   Default to `staff`; owner/admin roles require explicit owner approval. Do not grant access by email matching, triggers on public sign-up, or user-editable metadata.
3. Direct the person to `/staff/sign-in` through the owner's normal channel. They enter their work email; Supabase sends the sign-in link. The desk never asks for a password. This runbook does not send invitations automatically.
4. To revoke desk access, set that profile's `active` to false immediately. Every subsequent protected read checks it and RLS also stops customer/order reads. Revoke Auth sessions as appropriate through owner administration. An already rendered page cannot erase what someone has already seen; access is rechecked on reload/navigation, not through realtime monitoring.

If provisioning is interrupted, an Auth user without an active matching profile is denied. To restore access, correct the UUID/profile under owner control rather than loosening policies.

## Privacy and operational limits

- Routine reads use the publishable key plus the verified user's session. Existing private `is_active_staff()`/`is_admin()` helpers and RLS remain unchanged; no service-role client is used.
- Existing schema policies already permit some staff/admin writes through Supabase. This increment adds **no write UI or staff mutation endpoint** and does not redefine those pre-existing database capabilities.
- Sessions are HttpOnly, SameSite=Lax cookies scoped to `/staff`, Secure on HTTPS. Refresh runs in Next Proxy; active-profile authorization remains beside each data read. No client Supabase auth or local/session-storage copy of customer data is introduced.
- Server fetches and staff document/redirect responses are no-store. Plain document links avoid Next client prefetch/router-cache copies. History restoration conceals and reloads the old protected document to reauthorize. The strict-origin referrer policy sends only the origin, never a request path or callback code. No PII is included in metadata, links, errors or application logs. Detail URLs contain only opaque request UUIDs; list pagination contains only a page number.
- Auth outages fail closed. Sign-out attempts local-scope provider revocation and always removes this app's staff cookies; if Auth is offline, remote revocation may not complete. The browser is still signed out locally. Lost/stolen tokens require owner-side revocation and profile deactivation.
- Order item names, units, quantities and prices come from immutable order snapshots. Customer name/phone come from the request's linked customer; address/note come from the request. No current product join supplies historical truth. The list uses 25 rows per page and fetches one extra for pagination; concurrent new submissions may shift offset pages. Refresh returns to the newest requests.
- Times use Africa/Lagos. Estimates are not final prices, payment or availability confirmation. No order editing, payment, stock, delivery operations, analytics, maps or customer accounts are included.

## Verification references

Focused tests: `tests/staff-access.test.ts`, `staff-auth.test.ts`, `staff-session.test.ts`, `staff-ui.test.tsx`. The isolated `order-database.test.ts` harness includes RLS coverage for anon/non-staff/inactive and active staff/admin/owner, plus deactivation. Set `ORDER_TEST_DATABASE_URL` to an authorized **local** admin connection and `PSQL_BIN` if needed. It creates/applies migrations to a uniquely named test database and removes only that database; it never targets hosted production data. Missing connection configuration explicitly skips these tests.

Official references: [Supabase passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SSR cookie/session setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [owner-side createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser). Local Next.js 16 docs for Proxy, cookies, Route Handlers and the authorization data-access layer were consulted.
