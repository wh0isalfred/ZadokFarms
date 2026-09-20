// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { BASKET_STORAGE_KEY } from "../src/lib/basket";
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

it("filters requestable statuses, combines category/search, sorts names, and resets to farm order without mutating source data", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const original = JSON.stringify(products);
  try {
    await act(async () => root.render(<Storefront products={products} />));
    const names = () => [...container.querySelectorAll(".product-info h3")].map(x => x.textContent);
    const availability = container.querySelector<HTMLButtonElement>('.desktop-filters button')!;
    const sort = container.querySelector<HTMLSelectElement>('select[aria-label="Sort produce"]')!;
    const selectSort = async (value: string) => act(async () => { sort.value = value; sort.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(availability.getAttribute("aria-pressed")).toBe("false");
    expect(sort.value).toBe("farm");
    expect(names()).toEqual(products.map(x => x.name));
    await act(async () => availability.click());
    expect(availability.getAttribute("aria-pressed")).toBe("true");
    expect(names()).toEqual(products.filter(x => x.status !== "unavailable").map(x => x.name));
    expect(container.querySelectorAll(".product-status.limited")).toHaveLength(2);
    await selectSort("name-asc");
    const ascending = products.filter(x => x.status !== "unavailable").map(x => x.name).sort((a,b) => a.localeCompare(b,"en"));
    expect(names()).toEqual(ascending);
    await selectSort("name-desc");
    expect(names()).toEqual([...ascending].reverse());
    await selectSort("farm");
    expect(names()).toEqual(products.filter(x => x.status !== "unavailable").map(x => x.name));
    await act(async () => [...container.querySelectorAll<HTMLButtonElement>(".category-list button")].find(x => x.textContent === "Seedlings")!.click());
    expect(names()).toEqual([]);
    expect(container.querySelector(".no-results")!.textContent).toContain("No produce matches these filters");
    await act(async () => container.querySelector<HTMLButtonElement>(".no-results button")!.click());
    expect(names()).toEqual(products.map(x => x.name));
    expect(availability.getAttribute("aria-pressed")).toBe("false");
    await act(async () => {
      const input = container.querySelector<HTMLInputElement>('.search-panel input')!;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "pepper");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => availability.click());
    await selectSort("name-asc");
    expect(names()).toEqual(["Bell pepper", "Habanero pepper"]);
    await act(async () => container.querySelector<HTMLButtonElement>('.catalogue-heading > button')!.click());
    expect(names()).toEqual(products.map(x => x.name));
    expect(sort.value).toBe("farm");
    expect(JSON.stringify(products)).toBe(original);
  } finally { await act(async () => root.unmount()); container.remove(); localStorage.clear(); }
});

it("preserves basket quantities through filters and uses only the Seedlings nursery replacement", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<Storefront products={products} />));
    const first = container.querySelector(".product-card")!;
    await act(async () => first.querySelector<HTMLButtonElement>(".product-action")!.click());
    const basket = localStorage.getItem(BASKET_STORAGE_KEY);
    expect(basket).not.toBeNull();
    const buttons = [...container.querySelectorAll<HTMLButtonElement>(".category-list button")];
    await act(async () => buttons.find(x => x.textContent === "Seedlings")!.click());
    const seedling = container.querySelector(".product-card")!;
    expect(seedling.querySelector("img")!.getAttribute("src")).toContain("seedlings-nursery.jpg");
    expect(seedling.querySelector("button")).toBeNull();
    await act(async () => buttons[0].click());
    expect(container.querySelector(".product-card output")!.textContent).toBe("1");
    expect(localStorage.getItem(BASKET_STORAGE_KEY)).toBe(basket);
    for (const [index, img] of [...container.querySelectorAll<HTMLImageElement>(".product-image img")].entries()) {
      if (products[index].id !== "seedlings") expect(decodeURIComponent(img.src)).toContain(products[index].image);
    }
    const custom = products.map(x => x.id === "seedlings" ? { ...x, image: "/images/products/custom-nursery.jpg" } : x);
    await act(async () => root.render(<Storefront products={custom} />));
    expect(decodeURIComponent(container.querySelectorAll<HTMLImageElement>(".product-image img")[7].src)).toContain("custom-nursery.jpg");
  } finally { await act(async () => root.unmount()); container.remove(); localStorage.clear(); }
});
