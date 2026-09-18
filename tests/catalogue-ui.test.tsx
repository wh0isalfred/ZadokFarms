// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { Storefront } from "../src/components/storefront";
import { products } from "../src/data/products";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it("leads with content and exposes category selection without changing availability actions", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Storefront products={products} />));
    const heading = container.querySelector("h1")!;
    const categories = container.querySelector(".category-list")!;
    expect(heading.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const buttons = Array.from(categories.querySelectorAll("button"));
    expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
    await act(async () => buttons.find((button) => button.textContent === "Seedlings")!.click());
    expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
    expect(buttons.find((button) => button.textContent === "Seedlings")!.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll(".product-card")).toHaveLength(1);
    expect(container.querySelector(".product-status")!.textContent).toBe("Currently unavailable");
    expect(container.querySelector(".product-card button")).toBeNull();
    await act(async () => buttons[0].click());
    expect(container.querySelectorAll(".product-card")).toHaveLength(products.length);
    expect(container.querySelector(".product-status.limited")!.textContent).toBe("Limited");
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
  }
});
