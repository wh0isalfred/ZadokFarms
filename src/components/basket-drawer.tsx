"use client";

import { useEffect, useRef } from "react";
import type { Product } from "@/data/products";
import { formatNaira } from "@/data/products";
import { OrderRequestForm } from "@/components/order-request-form";

type BasketDrawerProps = {
  open: boolean;
  products: Product[];
  quantities: Record<string, number>;
  onClose: () => void;
  onAdd: (id: string) => void;
  onDecrease: (id: string) => void;
};

export function BasketDrawer({ open, products, quantities, onClose, onAdd, onDecrease }: BasketDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const items = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const total = items.reduce((sum, product) => sum + product.price * quantities[product.id], 0);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("drawer-open");
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;

      const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.classList.remove("drawer-open");
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocusedElement.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="drawer-layer open">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close your basket" />
      <aside className="basket-drawer" aria-describedby={items.length > 0 ? "basket-request-note" : undefined} aria-labelledby="basket-title" aria-modal="true" ref={drawerRef} role="dialog">
        <div className="drawer-heading">
          <div><p className="eyebrow">ORDER REQUEST</p><h2 id="basket-title">Your basket</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close your basket">×</button>
        </div>
        {items.length === 0 ? (
          <div className="empty-basket"><p>Your basket is empty.</p><button type="button" onClick={onClose}>Continue shopping</button></div>
        ) : (
          <>
            <div className="basket-items">
              {items.map((product) => (
                <div className="basket-row" key={product.id}>
                  <div><strong>{product.name}</strong><span>{formatNaira(product.price)} / {product.unit}</span></div>
                  <div className="mini-stepper" aria-label={`${product.name} quantity`}>
                    <button type="button" onClick={() => onDecrease(product.id)} aria-label={`Remove one ${product.name}`}>−</button>
                    <output aria-live="polite">{quantities[product.id]}</output>
                    <button type="button" onClick={() => onAdd(product.id)} aria-label={`Add another ${product.name}`}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="basket-summary"><span>Estimated total</span><strong>{formatNaira(total)}</strong></div>
            <p className="basket-note" id="basket-request-note">Final quantity, availability and fulfilment will be confirmed after you submit your request.</p>
            <OrderRequestForm products={products} quantities={quantities} />
          </>
        )}
      </aside>
    </div>
  );
}
