export const BASKET_STORAGE_KEY = "zadok-farm-basket-v1";

export type BasketQuantities = Record<string, number>;

type StoredBasket = {
  version: 1;
  quantities: BasketQuantities;
};

function isPositiveWholeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function sanitizeBasket(
  value: unknown,
  availableProductIds: ReadonlySet<string>,
): BasketQuantities {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value).filter(
      ([productId, quantity]) =>
        availableProductIds.has(productId) && isPositiveWholeNumber(quantity),
    ),
  );
}

export function readBasket(
  serializedBasket: string | null,
  availableProductIds: ReadonlySet<string>,
): BasketQuantities {
  if (!serializedBasket) return {};

  try {
    const parsedBasket: unknown = JSON.parse(serializedBasket);
    if (
      !parsedBasket ||
      typeof parsedBasket !== "object" ||
      !("version" in parsedBasket) ||
      !("quantities" in parsedBasket) ||
      parsedBasket.version !== 1
    ) {
      return {};
    }

    return sanitizeBasket(parsedBasket.quantities, availableProductIds);
  } catch {
    return {};
  }
}

export function serializeBasket(quantities: BasketQuantities): string {
  const basket: StoredBasket = { version: 1, quantities };
  return JSON.stringify(basket);
}

export function incrementBasketItem(
  quantities: BasketQuantities,
  productId: string,
): BasketQuantities {
  return { ...quantities, [productId]: (quantities[productId] ?? 0) + 1 };
}

export function decrementBasketItem(
  quantities: BasketQuantities,
  productId: string,
): BasketQuantities {
  const quantity = quantities[productId] ?? 0;
  if (quantity <= 1) {
    const remainingQuantities = { ...quantities };
    delete remainingQuantities[productId];
    return remainingQuantities;
  }

  return { ...quantities, [productId]: quantity - 1 };
}
