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

it("combines native availability/category/search filters, sorts without mutating products, and resets empty results", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const original = JSON.stringify(products);
  try {
    await act(async () => root.render(<Storefront products={products} />));
    const availability = container.querySelector<HTMLSelectElement>(".catalogue-filters select")!;
    const sort = container.querySelectorAll<HTMLSelectElement>(".catalogue-filters select")[1];
    const select = async (element: HTMLSelectElement, value: string) => act(async () => {
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(availability.value).toBe("all");
    expect(availability.closest("label")!.textContent).toContain("Produce availability");
    await select(availability, "requestable");
    expect(container.querySelectorAll(".product-card")).toHaveLength(8);
    expect(container.querySelector(".product-status.unavailable")).toBeNull();
    await select(availability, "limited");
    expect([...container.querySelectorAll(".product-info h3")].map(x => x.textContent)).toEqual(["Tomatoes", "Maize"]);
    await select(sort, "name");
    expect([...container.querySelectorAll(".product-info h3")].map(x => x.textContent)).toEqual(["Maize", "Tomatoes"]);
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>(".category-list button")].find(x => x.textContent === "Fruits")!.click());
    expect(container.querySelector(".no-results")!.textContent).toContain("No produce matches these filters");
    await act(async () => container.querySelector<HTMLButtonElement>(".no-results button")!.click());
    expect(container.querySelectorAll(".product-card")).toHaveLength(9);
    expect(availability.value).toBe("all");
    expect(sort.value).toBe("farm");
    await act(async () => container.querySelector<HTMLButtonElement>(".search-trigger")!.click());
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(document.activeElement).toBe(input);
    expect(container.querySelector(".search-trigger")!.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(".search-trigger")!.getAttribute("aria-controls")).toBe("catalogue-search");
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "pepper");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelectorAll(".product-card")).toHaveLength(2);
    expect(JSON.stringify(products)).toBe(original);
  } finally {
    await act(async () => root.unmount());
    container.remove();
    localStorage.clear();
  }
});
