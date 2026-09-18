import { describe, expect, it, vi } from "vitest";
import { handleOrderRequest } from "../src/lib/orders/boundary";
import { orderRequestSchema, orderDetailsSchema, receiptSchema } from "../src/lib/orders/contract";

const input = {
  key: "9748c004-6b63-4943-8d8c-e073d0808129",
  details: { name: "Test Customer", phone: "+234 801 234 5678", fulfilment: "to_confirm" },
  items: [{ slug: "cucumber", quantity: 2, expectedPrice: 3200, expectedName: "Cucumber", expectedUnit: "5 kg" }],
};
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("https://farm.test/api/order-requests", { method: "POST", headers: { origin: "https://farm.test", "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
}
const receipt = { reference: "ZF-20260917-A2B3C4", items: [{ name: "Cucumber", unit: "5 kg", price: 3200, quantity: 2 }] };

describe("order mutation boundary", () => {
  it("requires a bounded address only for delivery and strips it for pickup/guidance", () => {
    for (const delivery_address of ["", "   ", "x".repeat(501)]) {
      expect(orderDetailsSchema.safeParse({ ...input.details, fulfilment: "delivery", delivery_address }).success).toBe(false);
    }
    expect(orderDetailsSchema.parse({ ...input.details, fulfilment: "delivery", delivery_address: "  12 Test Street, Port Harcourt  " }).delivery_address).toBe("12 Test Street, Port Harcourt");
    for (const fulfilment of ["pickup", "to_confirm"]) {
      expect(orderDetailsSchema.parse({ ...input.details, fulfilment }).delivery_address).toBe("");
      expect(orderDetailsSchema.parse({ ...input.details, fulfilment, delivery_address: "old address" }).delivery_address).toBe("");
    }
    expect(orderDetailsSchema.safeParse({ ...input.details, note: "x".repeat(501) }).success).toBe(false);
  });
  it("accepts only six unambiguous reference characters", () => {
    expect(receiptSchema.safeParse(receipt).success).toBe(true);
    for (const suffix of ["A1B2C3", "A0B2C3", "AOB2C3", "AIB2C3", "ALB2C3", "ABCDEFGH"]) {
      expect(receiptSchema.safeParse({ ...receipt, reference: `ZF-20260917-${suffix}` }).success).toBe(false);
    }
  });
  it("normalizes phone and rejects duplicates, extra fields, empty baskets and unsafe quantities", () => {
    expect(orderRequestSchema.parse(input).details.phone).toBe("+2348012345678");
    for (const body of [
      { ...input, items: [] }, { ...input, items: [...input.items, ...input.items] },
      { ...input, total: 1 }, { ...input, details: { ...input.details, name: " " } },
      { ...input, items: [{ ...input.items[0], quantity: 1.5 }] },
      { ...input, items: [{ ...input.items[0], quantity: 10000 }] },
    ]) expect(orderRequestSchema.safeParse(body).success).toBe(false);
  });

  it("rejects cross-origin, malformed, invalid and oversized requests before the database", async () => {
    const gateway = vi.fn();
    expect((await handleOrderRequest(request(input, { origin: "https://evil.test" }), gateway, "secret")).status).toBe(403);
    expect((await handleOrderRequest(request(input, { "content-type": "text/plain" }), gateway, "secret")).status).toBe(415);
    expect((await handleOrderRequest(request({}), gateway, "secret")).status).toBe(422);
    expect((await handleOrderRequest(request("x".repeat(17000)), gateway, "secret")).status).toBe(413);
    const malformed = new Request("https://farm.test/api/order-requests", { method: "POST", headers: { origin: "https://farm.test", "content-type": "application/json" }, body: "{" });
    expect((await handleOrderRequest(malformed, gateway, "secret")).status).toBe(400);
    expect(gateway).not.toHaveBeenCalled();
  });

  it("uses stable keyed fingerprints and returns only the validated receipt", async () => {
    const gateway = vi.fn().mockResolvedValue({ data: { ...receipt, private: "not returned" }, error: null });
    const response = await handleOrderRequest(request(), gateway, "test-secret");
    expect(await response.json()).toEqual({ receipt });
    expect(response.headers.get("cache-control")).toBe("no-store");
    await handleOrderRequest(request({ ...input, details: { ...input.details, phone: "+2348012345678" } }), gateway, "test-secret");
    expect(gateway.mock.calls[0]).toEqual(gateway.mock.calls[1]);
    expect(gateway.mock.calls[0][2]).toMatch(/^[a-f0-9]{64}$/);
  });

  it("fails closed on database errors, malformed receipts and missing configuration", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    for (const result of [{ data: null, error: { code: "XX000", message: "private contact" } }, { data: {}, error: null }]) {
      const response = await handleOrderRequest(request(), async () => result, "secret");
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("private contact");
    }
    expect((await handleOrderRequest(request(), async () => { throw Error("timeout"); }, "secret")).status).toBe(503);
    const gateway = vi.fn();
    expect((await handleOrderRequest(request(), gateway, "")).status).toBe(503);
    expect(gateway).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("exposes safe retry/conflict responses", async () => {
    for (const code of ["rate_limited", "catalogue_changed", "key_conflict", "invalid_quantity"]) {
      const response = await handleOrderRequest(request(), async () => ({ data: { code }, error: null }), "secret");
      expect(response.status).toBe(code === "rate_limited" ? 429 : 409);
      if (code === "rate_limited") expect(response.headers.get("retry-after")).toBe("900");
    }
  });
});
