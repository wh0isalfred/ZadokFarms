import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ cookies: new Map<string, string>(), otp: vi.fn(), exchange: vi.fn(), signOut: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: (name: string) => ({ value: mocks.cookies.get(name) }), getAll: () => [...mocks.cookies].map(([name, value]) => ({ name, value })), set: (name: string, value: string) => mocks.cookies.set(name, value) }) }));
vi.mock("../src/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOtp: mocks.otp, exchangeCodeForSession: mocks.exchange, signOut: mocks.signOut } }) }));
import { requestSignIn, exchangeSignIn, signOut } from "../src/lib/staff/auth";
import { RETURN_COOKIE, STAFF_COOKIE } from "../src/lib/staff/security";
const request = (email: string, origin = "https://farm.test") => new Request("https://farm.test/staff/sign-in/request", { method: "POST", headers: { origin, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email, next: "//evil.test" }) });
beforeEach(() => { vi.stubEnv("ZADOK_SITE_URL", "https://farm.test"); mocks.cookies.clear(); mocks.otp.mockReset(); mocks.exchange.mockReset(); mocks.signOut.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
describe("staff sign-in and sign-out", () => {
  it("uses invite-only OTP and indistinguishable responses for success, failure and unknown emails", async () => {
    for (const result of [{ error: null }, { error: { message: "unknown user" } }, { error: { message: "rate limit" } }]) {
      mocks.otp.mockResolvedValueOnce(result);
      const response = await requestSignIn(request("staff@example.test"));
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe("/staff/sign-in?notice=sent");
      expect(await response.text()).toBe("");
      expect(response.headers.get("cache-control")).toContain("no-store");
    }
    expect(mocks.otp).toHaveBeenCalledWith({ email: "staff@example.test", options: { shouldCreateUser: false, emailRedirectTo: "https://farm.test/staff/auth/callback" } });
    expect(mocks.cookies.get(RETURN_COOKIE)).toBe("/staff/orders");
  });
  it("rejects cross-origin requests without calling Auth", async () => {
    expect((await requestSignIn(request("staff@example.test", "https://evil.test"))).status).toBe(403);
    expect((await signOut(request("", "https://evil.test"))).status).toBe(403);
    expect(mocks.otp).not.toHaveBeenCalled(); expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("exchanges a PKCE code then uses only the validated return cookie", async () => {
    mocks.exchange.mockResolvedValue({ error: null }); mocks.cookies.set(RETURN_COOKIE, "https://evil.test");
    const response = await exchangeSignIn(new Request("https://farm.test/staff/auth/callback?code=single-use&next=https://evil.test"));
    expect(mocks.exchange).toHaveBeenCalledWith("single-use");
    expect(response.headers.get("location")).toBe("/staff/orders");
    expect(mocks.cookies.get(RETURN_COOKIE)).toBe("");
  });
  it("handles missing or expired links without leaking tokens or provider errors", async () => {
    mocks.exchange.mockResolvedValue({ error: { message: "secret provider detail" } });
    for (const query of ["", "?code=expired"]) {
      const response = await exchangeSignIn(new Request(`https://farm.test/staff/auth/callback${query}`));
      expect(response.headers.get("location")).toBe("/staff/sign-in?notice=unavailable");
      expect(await response.text()).toBe("");
    }
  });
  it("signs out locally and clears only staff cookies, even during an Auth outage", async () => {
    for (const fails of [false, true]) {
      mocks.cookies.set(`${STAFF_COOKIE}.0`, "token"); mocks.cookies.set(RETURN_COOKIE, "/staff/orders"); mocks.cookies.set("other", "keep");
      mocks.signOut.mockImplementation(async () => { if (fails) throw Error("offline"); return { error: null }; });
      const response = await signOut(request(""));
      expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
      expect(mocks.cookies.get(`${STAFF_COOKIE}.0`)).toBe(""); expect(mocks.cookies.get("other")).toBe("keep");
      expect(response.headers.get("location")).toBe("/staff/sign-in?notice=signed-out");
    }
  });
});
