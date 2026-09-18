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
    expect(document.activeElement?.getAttribute("role")).toBe("alert");
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
    expect(document.body.textContent).toContain("Request recorded: ZF-20260917-A2B3C4");
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
