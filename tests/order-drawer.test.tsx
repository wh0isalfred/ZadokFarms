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
  await act(async () => { button.click(); });
}
async function fill(id: string, value: string) {
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
  document.body.replaceChildren(); sessionStorage.clear(); vi.unstubAllGlobals(); onClose.mockClear();
});

describe("progressive order drawer", () => {
  it("opens details deliberately, preserves drafts on back/close and returns to review when empty", async () => {
    await render();
    expect(document.querySelector("form")!.closest("[hidden]")).not.toBeNull();
    await click("Request details");
    expect(document.querySelector("form")!.closest("[hidden]")).toBeNull();
    expect(document.activeElement?.id).toBe("basket-title");
    await fill("order-name", "Draft Customer");
    await click("Back to basket"); await click("Request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("Draft Customer");
    await render({ cucumber: 2 }, false); await render(); await click("Request details");
    expect((document.getElementById("order-name") as HTMLInputElement).value).toBe("Draft Customer");
    await render({});
    expect(document.getElementById("basket-title")?.textContent).toBe("Your basket");
    expect(document.querySelector("form")!.closest("[hidden]")).not.toBeNull();
  });

  it("shows one conditional required address and accessible validation feedback", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await render(); await click("Request details");
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
    await render(); await click("Request details");
    await fill("order-name", "Test Customer"); await fill("order-phone", "+2348012345678");
    await fill("order-fulfilment", "delivery"); await fill("order-address", "12 Test Street, Port Harcourt");
    await submit();
    const original = fetcher.mock.calls[0][1].body;
    expect(document.body.textContent).toContain("Connection interrupted");
    await render({ cucumber: 2 }, false); await render({ cucumber: 3 }); await click("Request details");
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
    await render(); await click("Request details");
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
    await render(); await click("Request details");
    await act(async () => { document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })); });
    expect(document.activeElement?.textContent).toBe("Submit request");
    await render({ cucumber: 2 }, false);
    expect(document.activeElement).toBe(opener);
  });
});
