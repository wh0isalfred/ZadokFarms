import { describe, expect, it } from "vitest";
import {
  decrementBasketItem,
  incrementBasketItem,
  readBasket,
  sanitizeBasket,
  serializeBasket,
} from "../src/lib/basket";

const availableProducts = new Set(["cucumber", "tomatoes"]);

describe("basket persistence", () => {
  it("keeps only positive quantities for currently requestable products", () => {
    expect(sanitizeBasket({ cucumber: 2, tomatoes: 1, seedlings: 3, bad: -1 }, availableProducts)).toEqual({
      cucumber: 2,
      tomatoes: 1,
    });
  });

  it("safely ignores invalid or old device storage", () => {
    expect(readBasket("not JSON", availableProducts)).toEqual({});
    expect(readBasket(JSON.stringify({ version: 0, quantities: { cucumber: 2 } }), availableProducts)).toEqual({});
  });

  it("round-trips the current basket and removes an item at zero", () => {
    const basket = incrementBasketItem({ cucumber: 1 }, "cucumber");
    expect(readBasket(serializeBasket(basket), availableProducts)).toEqual({ cucumber: 2 });
    expect(decrementBasketItem({ cucumber: 1 }, "cucumber")).toEqual({});
  });
});
