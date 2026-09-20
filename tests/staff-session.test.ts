import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), options: null as unknown }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (_url: string, _key: string, options: unknown) => { mocks.options = options; return { auth: { getUser: mocks.getUser } }; } }));
import { proxy } from "../src/proxy";
import { createClient } from "../src/lib/supabase/server";
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: vi.fn() }) }));
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("staff cache and session transport", () => {
  it("marks all staff responses private and applies refreshed cookies in both directions", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.example"); vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-key"); vi.stubEnv("ZADOK_SITE_URL", "https://farm.test");
    mocks.getUser.mockImplementation(async () => {
      const options = mocks.options as { cookies: { setAll: (cookies: unknown[], headers: Record<string, string>) => void } };
      options.cookies.setAll([{ name: "zadok-staff-session", value: "rotated", options: { httpOnly: true, secure: true, path: "/staff" } }], { "Cache-Control": "private, no-store" });
      return { data: { user: null } };
    });
    const request = new NextRequest("https://farm.test/staff/orders");
    const response = await proxy(request);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin");
    expect(response.cookies.get("zadok-staff-session")?.value).toBe("rotated");
    expect(request.cookies.get("zadok-staff-session")?.value).toBe("rotated");
    expect(await response.text()).toBe("");
  });
  it("forces no-store on every server-client fetch", async () => {
    vi.stubEnv("ZADOK_SITE_URL", "https://farm.test");
    await createClient();
    const options = mocks.options as { global: { fetch: typeof fetch }; cookieOptions: Record<string, unknown> };
    const fetcher = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));
    await options.global.fetch("https://test.example/rest/v1/order_requests", { cache: "force-cache" });
    expect(fetcher.mock.calls[0][1]?.cache).toBe("no-store");
    expect(options.cookieOptions).toMatchObject({ httpOnly: true, secure: true, path: "/staff" });
  });
});
