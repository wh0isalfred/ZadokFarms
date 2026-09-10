"use client";

import { useEffect } from "react";
import type { Product } from "@/data/products";
import { formatNaira } from "@/data/products";

type BasketDrawerProps = {
  open: boolean;
  products: Product[];
  quantities: Record<string, number>;
  onClose: () => void;
  onAdd: (id: string) => void;
  onDecrease: (id: string) => void;
};

export function BasketDrawer({ open, products, quantities, onClose, onAdd, onDecrease }: BasketDrawerProps) {
  const items = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const total = items.reduce((sum, product) => sum + product.price * quantities[product.id], 0);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-layer open">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close your basket" />
      <aside className="basket-drawer" aria-label="Your basket" aria-modal="true" role="dialog">
        <div className="drawer-heading">
          <div><p className="eyebrow">ORDER REQUEST</p><h2>Your basket</h2></div>
          <button type="button" onClick={onClose} aria-label="Close your basket">×</button>
        </div>
        {items.length === 0 ? (
          <div className="empty-basket"><p>Your basket is empty.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
        ) : (
          <>
            <div className="basket-items">
              {items.map((product) => (
                <div className="basket-row" key={product.id}>
                  <div><strong>{product.name}</strong><span>{formatNaira(product.price)} / {product.unit}</span></div>
                  <div className="mini-stepper"><button type="button" onClick={() => onDecrease(product.id)}>−</button><span>{quantities[product.id]}</span><button type="button" onClick={() => onAdd(product.id)}>+</button></div>
                </div>
              ))}
            </div>
            <div className="basket-summary"><span>Estimated total</span><strong>{formatNaira(total)}</strong></div>
            <p className="basket-note">Final quantity, availability and fulfilment will be confirmed after you submit your request.</p>
            <button className="checkout-button" type="button">Continue with request</button>
          </>
        )}
      </aside>
    </div>
  );
}
