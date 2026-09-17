// @vitest-environment jsdom

import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { useBasket } from "../src/components/use-basket";
import { BASKET_STORAGE_KEY, serializeBasket } from "../src/lib/basket";
import type { Product } from "../src/data/products";

const products: Product[] = [
  { id: "cucumber", name: "Cucumber", category: "Vegetables", price: 3200, unit: "5 kg", status: "available", image: "/cucumber.jpg" },
  { id: "seedlings", name: "Seedlings", category: "Seedlings", price: 500, unit: "seedling", status: "unavailable", image: "/seedlings.jpg" },
];

let root: Root | undefined;
let latestBasket: ReturnType<typeof useBasket> | undefined;

function BasketHarness() {
  const basket = useBasket(products);
  useEffect(() => {
    latestBasket = basket;
  }, [basket]);
  return null;
}

async function renderBasket() {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root?.render(<BasketHarness />);
    await Promise.resolve();
  });
}

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  latestBasket = undefined;
  window.localStorage.clear();
  document.body.replaceChildren();
});

describe("useBasket", () => {
  it("loads only requestable products from device storage after hydration", async () => {
    window.localStorage.setItem(BASKET_STORAGE_KEY, serializeBasket({ cucumber: 2, seedlings: 1 }));

    await renderBasket();

    expect(latestBasket?.quantities).toEqual({ cucumber: 2 });
  });

  it("syncs a validated basket from another browser tab", async () => {
    await renderBasket();

    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", {
        key: BASKET_STORAGE_KEY,
        newValue: serializeBasket({ cucumber: 3, seedlings: 1 }),
      }));
    });

    expect(latestBasket?.quantities).toEqual({ cucumber: 3 });
  });
});
