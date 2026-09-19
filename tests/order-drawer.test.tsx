// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BasketDrawer } from "../src/components/basket-drawer";
import type { Product } from "../src/data/products";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const products: Product[] = [{ id: "cucumber", name: "Cucumber", category: "Vegetables", price: 3200, unit: "5 kg", status: "available", image: "/cucumber.jpg" }];
let root: Root | undefined;
const onClose = vi.fn();
async function render(quantities: Record<string, number> = { cucumber: 2 }, open = true) {
  if (!root) { const container = document.createElement("div"); document.body.append(container); root = createRoot(container); }
  await act(async () => { root!.render(<BasketDrawer open={open} products={products} quantities={quantities} onClose={onClose} onAdd={() => {}} onDecrease={() => {}} />); });
}
async function click(text: string) {
  const button = Array.from(document.querySelectorAll("button")).find((element) => element.textContent === text)!;
  await act(async () => { button.click(); await new Promise((resolve) => setTimeout(resolve, 20)); });
}
async function fill(id: string, value: string) {
  if (id === "order-fulfilment") {
    await act(async () => { (document.querySelector(`input[name=fulfilment][value=${value}]`) as HTMLInputElement).click(); });
    return;
  }
  const element = document.getElementById(id) as HTMLInputElement;
  const prototype = element.tagName === "SELECT" ? HTMLSelectElement.prototype : element.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
  });
}
async function submit() {
  await act(async () => { document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}
afterEach(async () => {
  await act(async () => root?.unmount()); root = undefined;
  await new Promise((resolve) => setTimeout(resolve, 20));
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
  document.body.replaceChildren(); sessionStorage.clear(); vi.unstubAllGlobals(); onClose.mockClear();
});

describe("progressive order drawer", () => {
  it("opens details deliberately, preserves drafts on back/close and returns to review when empty", async () => {
    await render();
    expect(document.querySelector("form")!.closest("[hidden]")).not.toBeNull();
    await click("Continue to request details");
    expect(document.querySelector("form")!.closest("[hidden]")).toBeNull();
    expect(document.activeElement?.id).toBe("basket-title");
    await fill("order-name", "Draft Customer");
    await click("Back to basket"); await click("Continue to request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("Draft Customer");
    await render({ cucumber: 2 }, false); await render(); await click("Continue to request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("Draft Customer");
    await render({});
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(document.querySelector("form")!.closest("[hidden]")).not.toBeNull();
  });

  it("shows one conditional required address and accessible validation feedback", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    expect(document.getElementById("order-address")).toBeNull();
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await fill("order-fulfilment", "delivery");
    expect((document.getElementById("order-address") as HTMLTextAreaElement).required).toBe(true);
    await submit();
    expect(fetcher).not.toHaveBeenCalled();
    expect(document.getElementById("order-address")?.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement?.id).toBe("order-address");
    expect(document.getElementById("order-address-error")?.textContent).toBe("Add a delivery address so Zadok can review the request.");
    await fill("order-address", "12 Test Street");
    expect(document.getElementById("order-address-error")).toBeNull();
    await fill("order-fulfilment", "pickup");
    expect(document.getElementById("order-address")).toBeNull();
  });

  it("retries the exact saved payload after a network failure and reopening the drawer", async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError("offline"));
    fetcher.mockResolvedValueOnce(Response.json({ receipt: { reference: "ZF-20260917-A2B3C4", items: [{ name: "Cucumber", unit: "5 kg", price: 3200, quantity: 2 }] } }));
    vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await fill("order-fulfilment", "delivery"); await fill("order-address", "12 Test Street, Port Harcourt");
    await submit();
    const original = fetcher.mock.calls[0][1].body;
    expect(document.body.textContent).toContain("Connection interrupted");
    await render({ cucumber: 2 }, false); await render({ cucumber: 3 }); await click("Continue to request details");
    expect((document.getElementById("order-address") as HTMLTextAreaElement).value).toBe("12 Test Street, Port Harcourt");
    await submit();
    expect(fetcher.mock.calls[1][1].body).toBe(original);
    expect(document.getElementById("basket-title")?.textContent).toBe("Request recorded");
    expect(document.body.textContent).toContain("ZF-20260917-A2B3C4");
    expect(sessionStorage.getItem("zadok-request-attempt-v1")).not.toContain("Test Customer");
  });

  it("prevents duplicate clicks while submission is pending", async () => {
    let finish: (value: Response) => void = () => {};
    const fetcher = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
    vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await submit(); await submit();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("true");
    expect((document.querySelector("button[type=submit]") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => { finish(Response.json({ message: "Temporarily unavailable" }, { status: 503 })); });
    expect(document.querySelector("form")?.getAttribute("aria-busy")).toBe("false");
  });

  it("keeps focus trapped around visible controls and restores the opener", async () => {
    const opener = document.createElement("button"); document.body.append(opener); opener.focus();
    await render(); await click("Continue to request details");
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })); });
    expect(document.activeElement?.textContent).toBe("Submit request");
    await render({ cucumber: 2 }, false);
    expect(document.activeElement).toBe(opener);
  });
});

describe("request UX increment", () => {
  it("prioritises field focus when basket and contact validation fail together", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await render({ cucumber: 10000 }); await click("Continue to request details");
    await submit();
    expect(document.activeElement?.id).toBe("order-name");
    expect(document.querySelector(".request-feedback")?.textContent).toContain("Your basket needs review");
    await fill("order-name", "Test Customer"); await submit();
    expect(document.activeElement?.id).toBe("order-phone");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("focuses invalid contact fields in order and clears only a corrected field's error", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    await fill("order-fulfilment", "delivery");
    await submit();
    expect(document.activeElement?.id).toBe("order-name");
    expect(document.getElementById("order-name-error")?.textContent).toBe("Enter the name we should use for this request.");
    expect(document.getElementById("order-phone-error")?.textContent).toBe("Enter your WhatsApp number and check the country calling code.");
    expect(document.querySelector(".request-feedback")?.textContent).toBe("");
    expect(document.body.textContent).not.toContain("Check the highlighted details and your basket");
    expect(document.getElementById("order-name")?.getAttribute("aria-describedby")).toBe("order-name-error");
    expect(document.querySelectorAll('.field-error[role="alert"], .field-error[aria-live]')).toHaveLength(0);
    await fill("order-name", "A");
    expect(document.getElementById("order-name-error")).not.toBeNull();
    await fill("order-name", "Test Customer");
    expect(document.getElementById("order-name-error")).toBeNull();
    expect(document.getElementById("order-phone-error")).not.toBeNull();
    expect(document.getElementById("order-address-error")).not.toBeNull();
    await submit();
    expect(document.activeElement?.id).toBe("order-phone");
    await fill("order-phone", "+2348012345678");
    expect(document.getElementById("order-phone-error")).toBeNull();
    expect(document.getElementById("order-address-error")).not.toBeNull();
    await submit();
    expect(document.activeElement?.id).toBe("order-address");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps basket imagery, labelled quantity controls and the review action outside the scroll body", async () => {
    await render();
    const row = document.querySelector(".basket-row")!;
    const image = row.querySelector("img")!;
    expect(image.alt).toBe("Cucumber");
    expect(image.src).toContain("cucumber.jpg");
    expect(row.querySelector('[aria-label="Remove one Cucumber"]')).not.toBeNull();
    expect(row.querySelector('[aria-label="Add another Cucumber"]')).not.toBeNull();
    expect(row.querySelector('output[aria-live="polite"]')?.textContent).toBe("2");
    expect(row.querySelector(".basket-line-total")?.textContent).toContain("6,400");
    const items = document.querySelector(".basket-items")!;
    const action = document.querySelector(".basket-review-action")!;
    expect(items.contains(action)).toBe(false);
    expect(items.nextElementSibling).toBe(action);
  });

  it("shows the live basket until an attempt is saved, then keeps that immutable summary", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await render(); await click("Continue to request details");
    expect(document.querySelector('[aria-label="Current basket summary"]')?.textContent).toContain("6,400");
    await render({ cucumber: 3 });
    expect(document.querySelector('[aria-label="Current basket summary"]')?.textContent).toContain("9,600");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await submit(); await render({ cucumber: 4 });
    const saved = document.querySelector('[aria-label="Saved request summary"]')!;
    expect(saved.textContent).toContain("9,600");
    expect(saved.textContent).toContain("3 × Cucumber");
    expect(saved.textContent).not.toContain("12,800");
    expect(saved.querySelector("button")).toBeNull();
  });

  it("keeps native fulfilment radios and the existing default, with one retained conditional address", async () => {
    await render(); await click("Continue to request details");
    expect(document.querySelectorAll('input[type="radio"][name="fulfilment"]')).toHaveLength(3);
    expect((document.querySelector('input[value="to_confirm"]') as HTMLInputElement).checked).toBe(true);
    expect(document.querySelector(".fulfilment-choices legend")?.textContent).toContain("receive your produce");
    await fill("order-fulfilment", "delivery"); await fill("order-address", "12 Test Street, Port Harcourt");
    await fill("order-fulfilment", "pickup");
    expect(document.getElementById("order-address")).toBeNull();
    await fill("order-fulfilment", "delivery");
    expect((document.getElementById("order-address") as HTMLTextAreaElement).value).toBe("12 Test Street, Port Harcourt");
    expect(document.querySelectorAll("#order-address")).toHaveLength(1);
  });

  it("reserves a separate action region outside all scrollable form content", async () => {
    await render(); await click("Continue to request details");
    const scroll = document.querySelector(".request-scroll")!;
    const action = document.querySelector(".request-action")!;
    expect(scroll.contains(document.getElementById("order-note"))).toBe(true);
    expect(scroll.contains(document.querySelector(".request-feedback"))).toBe(true);
    expect(scroll.contains(action)).toBe(false);
    expect(scroll.nextElementSibling).toBe(action);
    expect(action.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it("consumes one details history entry on Back and allows the next Back normally", async () => {
    window.history.pushState({ previous: true }, "", "/#previous");
    window.history.pushState({ framework: "preserved" }, "", "/");
    await render(); await click("Continue to request details");
    const length = window.history.length;
    expect(window.history.state.framework).toBe("preserved");
    // A repeated action while already on details must not push a second entry.
    await click("Continue to request details");
    expect(window.history.length).toBe(length);
    await act(async () => { window.history.back(); await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(window.history.state.framework).toBe("preserved");
    await act(async () => { window.history.back(); await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(window.location.hash).toBe("#previous");
    expect(window.history.state.previous).toBe(true);
  });

  it("does not accumulate history entries through Edit basket, reopen or empty-basket reset", async () => {
    await render(); await click("Continue to request details");
    const length = window.history.length;
    await click("Edit basket"); await click("Continue to request details");
    expect(window.history.length).toBe(length);
    await render({}, true);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(window.history.state?.zadokRequestDetails).toBeUndefined();
  });

  it("recovers a key conflict only explicitly, preserves details and unrelated storage, and submits a new key", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ code: "key_conflict", message: "Conflict" }, { status: 409 }))
      .mockRejectedValueOnce(new TypeError("offline"));
    vi.stubGlobal("fetch", fetcher);
    sessionStorage.setItem("unrelated", "keep me");
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await fill("order-fulfilment", "delivery"); await fill("order-address", "12 Test Street");
    await fill("order-note", "Call on arrival"); await submit();
    const original = JSON.parse(fetcher.mock.calls[0][1].body);
    expect((document.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    expect(JSON.parse(sessionStorage.getItem("zadok-request-attempt-v1")!).attempt.key).toBe(original.key);
    await render({ cucumber: 3 }, false); await render({ cucumber: 3 }); await click("Continue to request details");
    await click("Clear saved retry and review details");
    const stored = JSON.parse(sessionStorage.getItem("zadok-request-attempt-v1")!);
    expect(stored.attempt).toBeUndefined(); expect(stored.draft).toEqual(original.details);
    expect(sessionStorage.getItem("unrelated")).toBe("keep me");
    expect((document.getElementById("order-note") as HTMLTextAreaElement).value).toBe("Call on arrival");
    expect(document.querySelector('[aria-label="Current basket summary"]')?.textContent).toContain("9,600");
    await submit();
    const next = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(next.key).not.toBe(original.key); expect(next.details).toEqual(original.details);
    expect(next.items[0].quantity).toBe(3);
  });

  it("does not offer key-conflict reset for an uncertain network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678"); await submit();
    expect(document.querySelector(".conflict-recovery")).toBeNull();
    expect(document.body.textContent).toContain("Retry saved request");
  });

  it("uses an upper-bound wait explanation instead of a Retry-After countdown", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: "rate_limited", message: "Please wait 15 minutes" }, { status: 429, headers: { "Retry-After": "900" } })));
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678"); await submit();
    expect(document.querySelector(".request-feedback")?.textContent).toContain("wait up to 15 minutes");
    expect(document.body.textContent).not.toContain("15:00");
    expect((document.getElementById("order-name") as HTMLInputElement).matches(":disabled")).toBe(false);
  });
});

describe("WhatsApp country calling code", () => {
  it("defaults to Nigeria and submits a national number using the unchanged international contract", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline")); vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    const country = document.getElementById("order-country") as HTMLSelectElement;
    expect(country.value).toBe("NG");
    expect(country.selectedOptions[0].textContent).toBe("Nigeria (+234)");
    expect(country.options).toHaveLength(245);
    const phone = document.getElementById("order-phone") as HTMLInputElement;
    expect(phone.type).toBe("tel"); expect(phone.inputMode).toBe("tel"); expect(phone.autocomplete).toBe("tel-national");
    await fill("order-name", "Test Customer"); await submit();
    expect(document.activeElement).toBe(phone);
    expect(document.querySelector(".request-feedback")?.textContent).toBe("");
    await fill("order-phone", "0801 234 5678"); await submit();
    expect(JSON.parse(fetcher.mock.calls[0][1].body).details.phone).toBe("+2348012345678");
  });

  it("uses the selected calling code and retains that draft across reopening", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline")); vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    await fill("order-country", "GB"); await fill("order-phone", "07911 123456");
    await fill("order-name", "Test Customer");
    await render({ cucumber: 2 }, false); await render(); await click("Continue to request details");
    expect((document.getElementById("order-country") as HTMLSelectElement).value).toBe("GB");
    expect((document.getElementById("order-phone") as HTMLInputElement).value).toBe("07911 123456");
    await submit();
    expect(JSON.parse(fetcher.mock.calls[0][1].body).details.phone).toBe("+447911123456");
  });

  it("restores an existing international draft without changing its canonical number", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline")); vi.stubGlobal("fetch", fetcher);
    sessionStorage.setItem("zadok-request-attempt-v1", JSON.stringify({ draft: { name: "Test Customer", phone: "+447911123456", fulfilment: "pickup", delivery_address: "", note: "" } }));
    await render(); await click("Continue to request details");
    expect((document.getElementById("order-country") as HTMLSelectElement).value).toBe("GB");
    expect((document.getElementById("order-phone") as HTMLInputElement).value).toBe("7911123456");
    await submit();
    expect(JSON.parse(fetcher.mock.calls[0][1].body).details.phone).toBe("+447911123456");
  });

  it("projects an unresolved saved attempt without changing a byte of its retry payload", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline")); vi.stubGlobal("fetch", fetcher);
    const original = JSON.stringify({ key: "cd1b443f-a666-4400-8e6c-50168cc7cd20", details: { name: "Test Customer", phone: "+390236618300", fulfilment: "pickup", delivery_address: "", note: "Saved note" }, items: [{ slug: "cucumber", quantity: 2, expectedPrice: 3200, expectedName: "Cucumber", expectedUnit: "5 kg" }] });
    sessionStorage.setItem("zadok-request-attempt-v1", `{"attempt":${original}}`);
    await render(); await click("Continue to request details");
    expect((document.getElementById("order-country") as HTMLSelectElement).value).toBe("IT");
    expect((document.getElementById("order-phone") as HTMLInputElement).value).toBe("0236618300");
    expect((document.getElementById("order-country") as HTMLSelectElement).matches(":disabled")).toBe(true);
    expect(sessionStorage.getItem("zadok-request-attempt-v1")).toBe(`{"attempt":${original}}`);
    await submit(); await render({ cucumber: 3 }); await submit();
    expect(fetcher.mock.calls[0][1].body).toBe(original);
    expect(fetcher.mock.calls[1][1].body).toBe(original);
  });
});

describe("recorded confirmation and WhatsApp handoff", () => {
  const recorded = { reference: "ZF-20260917-A2B3C4", items: [{ name: "Recorded produce", unit: "crate", price: 4500, quantity: 3 }], fulfilment: "delivery", delivery_address: "12 Recorded Street, Port Harcourt", whatsappUrl: "https://wa.me/12025550123?text=Recorded%20request%20ZF-20260917-A2B3C4" };

  it.each([200, 409])("ignores a late overlapping response (%s) after starting another request", async (status) => {
    const finishes: ((response: Response) => void)[] = [];
    const fetcher = vi.fn<typeof fetch>(() => new Promise<Response>((resolve) => finishes.push(resolve)));
    vi.stubGlobal("fetch", fetcher);
    await render(); await click("Continue to request details");
    await fill("order-name", "First customer"); await fill("order-phone", "08012345678");
    await submit();
    await render({ cucumber: 2 }, false);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    await render(); await click("Continue to request details");
    await submit();
    expect(fetcher.mock.calls[0][1]?.body).toBe(fetcher.mock.calls[1][1]?.body);
    await act(async () => finishes[0](Response.json({ receipt: recorded })));
    await click("Start another request");
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 50)); });
    await click("Continue to request details");
    await fill("order-name", "New customer"); await fill("order-phone", "08098765432");
    await submit();
    const current = sessionStorage.getItem("zadok-request-attempt-v1");
    await act(async () => finishes[1](Response.json(status === 200 ? { receipt: recorded } : { code: "catalogue_changed" }, { status })));
    expect(sessionStorage.getItem("zadok-request-attempt-v1")).toBe(current);
    expect(document.getElementById("basket-title")?.textContent).toBe("Request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("New customer");
    await act(async () => finishes[2](Response.json({ receipt: { ...recorded, reference: "ZF-20260917-B3C4D5" } })));
    expect(document.querySelector(".recorded-reference")?.textContent).toBe("ZF-20260917-B3C4D5");
  });

  it("shows an accessible handoff only after acceptance, using recorded snapshots", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ receipt: recorded })));
    await render(); await click("Continue to request details");
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
    await fill("order-name", "Test Customer"); await fill("order-phone", "08012345678");
    await submit();
    expect(document.activeElement?.textContent).toBe("Request recorded");
    const confirmation = document.querySelector(".recorded-request")!;
    expect(confirmation.textContent).toContain("Recorded produce");
    expect(confirmation.textContent).toContain("3 × crate");
    expect(confirmation.textContent).toContain("13,500");
    expect(confirmation.textContent).toContain(recorded.delivery_address);
    expect(confirmation.textContent).toContain("Availability, fulfilment and payment are not confirmed");
    expect(confirmation.textContent).toContain("send the prepared message");
    expect(confirmation.textContent).not.toContain("Cucumber");
    const link = confirmation.querySelector("a")!;
    expect(link.href).toBe(recorded.whatsappUrl); expect(link.target).toBe("_blank");
    expect(link.rel).toBe("noopener noreferrer");
    expect(link.textContent).toContain("opens in a new tab or window");
    expect(link.closest(".request-scroll")).toBeNull();
    expect(JSON.parse(sessionStorage.getItem("zadok-request-attempt-v1")!)).toEqual({ receipt: recorded });
    await render({ cucumber: 9 }, false); await render({ cucumber: 9 });
    expect(document.querySelector(".recorded-request a")?.getAttribute("href")).toBe(recorded.whatsappUrl);
    expect(document.querySelector(".recorded-subtotal")?.textContent).toContain("13,500");
  });

  it("recovers after a fresh mount even with an empty basket and keeps normal Back/Forward", async () => {
    sessionStorage.setItem("zadok-request-attempt-v1", JSON.stringify({ receipt: recorded }));
    await render({});
    expect(document.getElementById("basket-title")?.textContent).toBe("Request recorded");
    expect(document.querySelector(".recorded-request")?.closest("[hidden]")).toBeNull();
    expect(document.querySelector(".recorded-reference")?.textContent).toBe(recorded.reference);
    await act(async () => { window.history.back(); await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(document.body.textContent).toContain("View recorded request");
    await act(async () => { window.history.forward(); await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(document.getElementById("basket-title")?.textContent).toBe("Request recorded");
  });

  it("keeps legacy and unavailable confirmations truthful without a fake link", async () => {
    sessionStorage.setItem("zadok-request-attempt-v1", JSON.stringify({ receipt: { reference: recorded.reference, items: recorded.items } }));
    await render();
    expect(document.getElementById("basket-title")?.textContent).toBe("Request recorded");
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
    expect(document.body.textContent).toContain("WhatsApp link is unavailable");
    expect(document.body.textContent).toContain("Not available in this saved confirmation");
    expect(document.body.textContent).toContain(recorded.reference);
  });

  it("starts another request without clearing basket or unrelated storage", async () => {
    sessionStorage.setItem("zadok-request-attempt-v1", JSON.stringify({ receipt: recorded }));
    sessionStorage.setItem("unrelated", "keep me");
    await render(); await click("Start another request");
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(sessionStorage.getItem("zadok-request-attempt-v1")).toBeNull();
    expect(sessionStorage.getItem("unrelated")).toBe("keep me");
    expect(document.querySelector(".basket-row output")?.textContent).toBe("2");
    await click("Continue to request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("");
    expect(document.querySelector(".recorded-request")).toBeNull();
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
  });

  it("keeps an accepted reference visible if both receipt persistence and cleanup fail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw Error("storage full"); });
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw Error("storage unavailable"); });
      return Response.json({ receipt: recorded });
    }));
    await render(); await click("Continue to request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "08012345678"); await submit();
    expect(document.body.textContent).toContain(recorded.reference);
    expect(document.body.textContent).toContain("We could not save this confirmation");
    expect(document.body.textContent).not.toContain("Connection interrupted");
    await click("Start another request");
    expect(document.body.textContent).toContain("We could not reset the saved request");
    expect(document.body.textContent).toContain(recorded.reference);
  });
});

describe("history recovery edges", () => {
  it("does not force another traversal when Forward reaches details after the drawer was closed", async () => {
    await render(); await click("Continue to request details");
    await render({ cucumber: 2 }, false);
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
    const back = vi.spyOn(window.history, "back");
    await act(async () => { window.history.forward(); await new Promise((resolve) => setTimeout(resolve, 30)); });
    expect(back).not.toHaveBeenCalled();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
