import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthSessionMissingError, createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { readOrder, readOrders, LIST_FIELDS, DETAIL_FIELDS, pageNumber } from "../src/lib/staff/orders";
import { staffAccess } from "../src/lib/staff/access";
import { safeReturnPath, siteOrigin, privateHeaders, staffCookieOptions } from "../src/lib/staff/security";
const id = "11111111-1111-4111-8111-111111111111";
function setup(user: boolean, profile: unknown = { id, full_name: "Staff fixture", active: true }) {
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const path = new URL(String(input)).pathname;
    return Response.json(path.endsWith("staff_profiles") ? profile : []);
  });
  const client = createClient<Database>("https://test.example", "public-key", { global: { fetch: fetcher }, auth: { persistSession: false, autoRefreshToken: false } });
  vi.spyOn(client.auth, "getUser").mockResolvedValue(user ? { data: { user: { id, aud: "authenticated", created_at: "2026-09-20T00:00:00Z", app_metadata: {}, user_metadata: { role: "owner" } } }, error: null } : { data: { user: null }, error: new AuthSessionMissingError() });
  return { client, fetcher };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("staff authorization and read boundary", () => {
  it("does not read a profile or customer data without an authenticated user", async () => {
    const { client, fetcher } = setup(false);
    expect((await readOrders(client, 1)).access.kind).toBe("unauthenticated");
    expect((await readOrder(client, id)).access.kind).toBe("unauthenticated");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([null, { id, full_name: "Inactive", active: false }, { id: "other", active: true }])("denies missing, inactive or mismatched profiles despite metadata", async (profile) => {
    const { client, fetcher } = setup(true, profile);
    expect((await readOrders(client, 1)).access.kind).toBe("denied");
    expect((await readOrder(client, id)).access.kind).toBe("denied");
    expect(fetcher.mock.calls.every(([url]) => String(url).includes("staff_profiles"))).toBe(true);
  });
  it("queries exact user and active profile before bounded, snapshot-only reads", async () => {
    const { client, fetcher } = setup(true);
    expect((await readOrders(client, 2)).access.kind).toBe("active");
    expect((await readOrder(client, id)).access.kind).toBe("active");
    const urls = fetcher.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls[0].searchParams.get("id")).toBe(`eq.${id}`);
    expect(urls[0].searchParams.get("active")).toBe("eq.true");
    expect(urls[1].searchParams.get("select")).toBe(LIST_FIELDS);
    expect(urls[1].searchParams.get("offset")).toBe("25");
    expect(urls[1].searchParams.get("limit")).toBe("26");
    expect(urls[3].searchParams.get("select")).toBe(DETAIL_FIELDS);
    expect(urls[3].searchParams.get("id")).toBe(`eq.${id}`);
    expect(DETAIL_FIELDS).not.toMatch(/\*|products\(|internal_note|idempotency_key/);
    expect(LIST_FIELDS).not.toMatch(/phone|address|note/);
  });
  it("fails closed without provider error details and rechecks revoked profiles", async () => {
    const { client, fetcher } = setup(true);
    expect((await staffAccess(client)).kind).toBe("active");
    fetcher.mockResolvedValueOnce(Response.json(null));
    expect((await staffAccess(client)).kind).toBe("denied");
    fetcher.mockResolvedValueOnce(Response.json({ message: "Private contact and database detail" }, { status: 400 }));
    expect(await staffAccess(client)).toEqual({ kind: "unavailable" });
  });
  it("validates detail IDs after authorization without querying customer data", async () => {
    const { client, fetcher } = setup(true);
    expect((await readOrder(client, "customer@example.test")).order).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
describe("staff return paths and privacy", () => {
  it.each([undefined, "https://evil.test", "//evil.test", "/\\evil.test", "/staff/orders?email=secret", "/staff/orders#secret", "/staff/orders/../sign-out", "/staff/orders/%2f%2fevil.test", ["/staff/orders"]])("rejects unsafe return %s", (path) => expect(safeReturnPath(path)).toBe("/staff/orders"));
  it("retains only allowed order destinations and bounded page numbers", () => {
    expect(safeReturnPath(`/staff/orders/${id}`)).toBe(`/staff/orders/${id}`);
    expect(pageNumber("2")).toBe(2);
    for (const p of ["-1", "0", "100000", "email", ["2"]]) expect(pageNumber(p)).toBe(1);
    expect(privateHeaders["Cache-Control"]).toContain("no-store");
    expect(privateHeaders["Referrer-Policy"]).toBe("strict-origin");
  });
  it("requires a configured canonical origin and secure HttpOnly scoped cookies", () => {
    for (const value of ["", "http://production.test", "https://site.test/path", "https://user:pass@site.test", "https://site.test?x=y"]) { vi.stubEnv("ZADOK_SITE_URL", value); expect(siteOrigin()).toBeNull(); }
    vi.stubEnv("ZADOK_SITE_URL", "https://farm.test");
    expect(siteOrigin()).toBe("https://farm.test");
    expect(staffCookieOptions()).toEqual({ httpOnly: true, secure: true, sameSite: "lax", path: "/staff" });
  });
});
