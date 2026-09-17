"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/data/products";
import {
  BASKET_STORAGE_KEY,
  decrementBasketItem,
  incrementBasketItem,
  readBasket,
  serializeBasket,
  type BasketQuantities,
} from "@/lib/basket";

function loadBasket(availableProductIds: ReadonlySet<string>): BasketQuantities {
  try {
    return readBasket(window.localStorage.getItem(BASKET_STORAGE_KEY), availableProductIds);
  } catch {
    return {};
  }
}

function persistBasket(quantities: BasketQuantities) {
  try {
    window.localStorage.setItem(BASKET_STORAGE_KEY, serializeBasket(quantities));
  } catch {
    // Browsing can continue when storage is blocked or full; only persistence is unavailable.
  }
}

export function useBasket(products: Product[]) {
  const availableProductIds = useMemo(
    () => new Set(products.filter((product) => product.status !== "unavailable").map((product) => product.id)),
    [products],
  );
  // Start empty on both server and client so device storage cannot cause hydration drift.
  const [quantities, setQuantities] = useState<BasketQuantities>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setQuantities(loadBasket(availableProductIds));
      setHasLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [availableProductIds]);

  useEffect(() => {
    if (!hasLoaded) return;
    persistBasket(quantities);
  }, [hasLoaded, quantities]);

  useEffect(() => {
    const syncBasket = (event: StorageEvent) => {
      if (event.key === BASKET_STORAGE_KEY) {
        setQuantities(readBasket(event.newValue, availableProductIds));
      }
    };

    window.addEventListener("storage", syncBasket);
    return () => window.removeEventListener("storage", syncBasket);
  }, [availableProductIds]);

  return {
    quantities,
    add: (productId: string) => {
      if (!availableProductIds.has(productId)) return;
      setQuantities((current) => incrementBasketItem(current, productId));
    },
    decrease: (productId: string) =>
      setQuantities((current) => decrementBasketItem(current, productId)),
  };
}
