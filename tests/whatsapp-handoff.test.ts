import { describe, expect, it } from "vitest";
import { whatsappHandoff } from "../src/lib/orders/whatsapp.server";
import { recordedReceiptSchema } from "../src/lib/orders/contract";
import { handleOrderRequest } from "../src/lib/orders/boundary";

const receipt = { reference: "ZF-20260917-A2B3C4", items: [{ name: "Accepted cucumber & peppers", unit: "5 kg", price: 3200, quantity: 2 }], fulfilment: "delivery" as const, delivery_address: "12 Test Street\nArea & City" };
const input = { key: "9748c004-6b63-4943-8d8c-e073d0808129", details: { name: "Test Customer", phone: "+2348012345678", fulfilment: "delivery", delivery_address: receipt.delivery_address }, items: [{ slug: "cucumber", quantity: 1, expectedPrice: 1, expectedName: "Editable basket name", expectedUnit: "crate" }] };
const request = () => new Request("https://farm.test/api/order-requests", { method: "POST", headers: { origin: "https://farm.test", "content-type": "application/json" }, body: JSON.stringify(input) });

describe("recorded WhatsApp handoff", () => {
  it("normalises configuration and encodes a concise request message", () => {
    const url = new URL(whatsappHandoff(receipt, "+1 (202) 555-0123")!);
    expect(url.origin + url.pathname).toBe("https://wa.me/12025550123");
    const message = url.searchParams.get("text")!;
    expect(message).toContain(receipt.reference);
    expect(message).toContain("2 x Accepted cucumber & peppers (5 kg)");
    expect(message).toContain("Fulfilment preference: Delivery");
    expect(message).toContain("Delivery address: 12 Test Street Area & City");
    expect(message).not.toMatch(/order confirmed|pay|fee|ETA|reservation/i);
    expect(recordedReceiptSchema.parse({ ...receipt, whatsappUrl: url.href }).whatsappUrl).toBe(url.href);
  });

  it.each([undefined, "", "08012345678", "0012025550123", "+0000000000", "123", "+1234567890123456", "https://wa.me/12025550123", "+12025550123 ext 2", "+1+2025550123", "+12025550123?text=bad"])("omits missing or malformed configuration: %s", (number) => {
    expect(whatsappHandoff(receipt, number)).toBeNull();
  });

  it.each(["pickup", "to_confirm"] as const)("omits delivery address for %s", (fulfilment) => {
    const url = new URL(whatsappHandoff({ ...receipt, fulfilment }, "12025550123")!);
    expect(url.searchParams.get("text")).not.toContain("Delivery address");
    expect(url.searchParams.get("text")).toContain(fulfilment === "pickup" ? "Pickup" : "I need guidance");
  });

  it("builds the API handoff only after acceptance and uses returned item snapshots", async () => {
    const gateway = async () => ({ data: { reference: receipt.reference, items: receipt.items }, error: null });
    const response = await handleOrderRequest(request(), gateway, "test-secret", "+12025550123");
    const accepted = (await response.json()).receipt;
    expect(response.status).toBe(200);
    expect(accepted.fulfilment).toBe("delivery");
    expect(accepted.delivery_address).toBe(receipt.delivery_address);
    const message = new URL(accepted.whatsappUrl).searchParams.get("text")!;
    expect(message).toContain("2 x Accepted cucumber & peppers (5 kg)");
    expect(message).not.toContain("Editable basket name");
    for (const number of [undefined, "bad number"]) {
      const missing = await handleOrderRequest(request(), gateway, "test-secret", number);
      expect(missing.status).toBe(200);
      expect((await missing.json()).receipt).toEqual({ ...receipt, whatsappUrl: null });
    }
    for (const code of ["key_conflict", "catalogue_changed", "rate_limited"]) {
      const rejected = await handleOrderRequest(request(), async () => ({ data: { code }, error: null }), "test-secret", "+12025550123");
      expect(await rejected.text()).not.toContain("wa.me");
    }
  });

  it("rejects unsafe recovered URLs without losing the recorded reference", () => {
    for (const whatsappUrl of ["javascript:alert(1)", "https://wa.me.evil.test/12025550123?text=hello", "https://wa.me@evil.test/12025550123?text=hello", "http://wa.me/12025550123?text=hello"]) {
      expect(recordedReceiptSchema.parse({ ...receipt, whatsappUrl })).toEqual({ ...receipt, whatsappUrl: null });
    }
    expect(recordedReceiptSchema.parse({ reference: receipt.reference, items: receipt.items })).toEqual({ reference: receipt.reference, items: receipt.items });
  });
});
