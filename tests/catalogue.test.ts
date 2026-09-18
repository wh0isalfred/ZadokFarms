// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublishedProducts } from "../src/lib/products";

const row = {
  slug: "cucumber", name: "Cucumber", price_ngn: 3200, price_prefix: null,
  selling_unit: "5 kg", status: "available", image_path: null, image_alt: null,
  product_categories: { name: "Vegetables" },
};
function setup() {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://catalogue.example.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
  const request = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", request);
  return request;
}
function response(rows: unknown) {
  return new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } });
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("public catalogue freshness", () => {
  it("reads updated prices, units and availability on the next call without cookies or a persistent cache", async () => {
    const request = setup();
    request.mockResolvedValueOnce(response([row]));
    request.mockResolvedValueOnce(response([{ ...row, price_ngn: 4100, selling_unit: "2 kg", status: "unavailable" }]));
    expect(await getPublishedProducts()).toEqual([expect.objectContaining({ id: "cucumber", price: 3200, unit: "5 kg", status: "available" })]);
    expect(await getPublishedProducts()).toEqual([expect.objectContaining({ price: 4100, unit: "2 kg", status: "unavailable" })]);
    expect(request).toHaveBeenCalledTimes(2);
    for (const [input, init] of request.mock.calls) {
      const url = new URL(String(input));
      expect(url.searchParams.get("published_at")).toBe("not.is.null");
      expect(url.searchParams.get("status")).toBe("in.(available,limited,unavailable)");
      expect(init?.cache).toBe("no-store");
      const headers = new Headers(init?.headers);
      expect(headers.has("cookie")).toBe(false);
      expect(headers.get("apikey")).toBe("public-test-key");
    }
  });
  it("does not substitute concept products or previous results on failure; a subsequent call can recover", async () => {
    const request = setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    request.mockResolvedValueOnce(response([row]));
    request.mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unavailable" }), { status: 400 }));
    request.mockResolvedValueOnce(response([{ ...row, price_ngn: 4200 }]));
    expect(await getPublishedProducts()).toHaveLength(1);
    expect(await getPublishedProducts()).toBeNull();
    expect(await getPublishedProducts()).toEqual([expect.objectContaining({ price: 4200 })]);
  });
  it("distinguishes an empty published catalogue from missing configuration", async () => {
    const request = setup();
    request.mockResolvedValueOnce(response([]));
    expect(await getPublishedProducts()).toEqual([]);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(await getPublishedProducts()).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });
});
