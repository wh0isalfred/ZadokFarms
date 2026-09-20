"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Image from "next/image";
import type { Product } from "@/data/products";
import { formatNaira } from "@/data/products";
import { useRequestStep } from "@/components/use-request-step";
import { OrderRequestForm } from "@/components/order-request-form";
import { RequestRecorded } from "@/components/request-recorded";
import { REQUEST_STORAGE_KEY, type RecordedReceipt } from "@/lib/orders/contract";

type BasketDrawerProps = {
  open: boolean;
  products: Product[];
  quantities: Record<string, number>;
  onClose: () => void;
  onAdd: (id: string) => void;
  onDecrease: (id: string) => void;
};

export function BasketDrawer({ open, products, quantities, onClose, onAdd, onDecrease }: BasketDrawerProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [receipt, setReceipt] = useState<RecordedReceipt | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);
  const requestGeneration = useRef(0);
  const [generation, setGeneration] = useState(0);
  const items = products.filter((product) => (quantities[product.id] ?? 0) > 0);
  const total = items.reduce((sum, product) => sum + product.price * quantities[product.id], 0);

  const { detailsOpen, showDetails, showReview } = useRequestStep(open, items.length > 0 || !!receipt);
  const revealReceipt = useEffectEvent(() => { if (open && receipt) showDetails(); });
  useEffect(() => { queueMicrotask(() => revealReceipt()); }, [open, receipt]);
  function record(accepted: RecordedReceipt, failed: boolean) {
    requestGeneration.current += 1;
    setGeneration((current) => current + 1);
    setStorageFailed(failed);
    setReceipt(accepted);
  }
  function startAnother() {
    try { sessionStorage.removeItem(REQUEST_STORAGE_KEY); }
    catch { return "We could not reset the saved request in this tab. Your recorded request is still shown."; }
    requestGeneration.current += 1;
    setGeneration((current) => current + 1);
    setReceipt(null);
    setStorageFailed(false);
    showReview();
    return null;
  }
  const closeDrawer = useEffectEvent(() => { showReview(); onClose(); });
  function close() { showReview(); onClose(); }

  useEffect(() => {
    if (!open) return;
    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("drawer-open");
    document.documentElement.classList.add("drawer-open");
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
      if (event.key !== "Tab") return;

      const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
      );
      const visibleElements = Array.from(focusableElements ?? []).filter((element) => !element.closest("[hidden]") && !element.matches(":disabled"));
      if (!visibleElements.length) return;

      const firstElement = visibleElements[0];
      const lastElement = visibleElements[visibleElements.length - 1];
      if (event.shiftKey && (document.activeElement === firstElement || document.activeElement === headingRef.current)) {
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
      document.documentElement.classList.remove("drawer-open");
      document.removeEventListener("keydown", closeOnEscape);
      previouslyFocusedElement.current?.focus();
    };
  }, [open]);

  useEffect(() => { if (open) headingRef.current?.focus(); }, [detailsOpen, open, receipt]);

  if (!open) return null;

  return (
    <div className="drawer-layer open">
      <button className="drawer-backdrop" type="button" onClick={close} aria-label="Close your basket" />
      <aside className="basket-drawer" aria-describedby={detailsOpen ? receipt ? "recorded-note" : "order-details-note" : items.length > 0 ? "basket-request-note" : undefined} aria-labelledby="basket-title" aria-modal="true" ref={drawerRef} role="dialog">
        <div className="drawer-heading">
          <div>{detailsOpen && <button className="request-back" type="button" onClick={showReview}>Back to basket</button>}<p className="eyebrow">ORDER REQUEST</p><h2 id="basket-title" ref={headingRef} tabIndex={-1}>{detailsOpen ? receipt ? "Request recorded" : "Request details" : "Your basket"}</h2></div>
          <button ref={closeButtonRef} type="button" onClick={close} aria-label="Close your basket">×</button>
        </div>
        <div className="drawer-step basket-review" hidden={detailsOpen}>
        {items.length === 0 ? (
          <div className="empty-basket"><p>Your basket is empty.</p>{receipt && <button type="button" onClick={showDetails}>View recorded request</button>}<button type="button" onClick={close}>Continue shopping</button></div>
        ) : (
          <>
            <div className="basket-items">
              {items.map((product) => (
                <div className="basket-row" key={product.id}>
                  <Image className="basket-thumbnail" src={product.image} alt={product.imageAlt ?? product.name} width={64} height={64} />
                  <div className="basket-product"><strong>{product.name}</strong><span>{formatNaira(product.price)} / {product.unit}</span></div>
                  <div className="basket-row-actions">
                  <div className="mini-stepper" aria-label={`${product.name} quantity`}>
                    <button type="button" onClick={() => onDecrease(product.id)} aria-label={`Remove one ${product.name}`}>−</button>
                    <output aria-live="polite">{quantities[product.id]}</output>
                    <button type="button" onClick={() => onAdd(product.id)} aria-label={`Add another ${product.name}`}>+</button>
                  </div>
                  <strong className="basket-line-total"><span className="sr-only">Line estimate: </span>{formatNaira(product.price * quantities[product.id])}</strong>
                  </div>
                </div>
              ))}
            </div>
            <div className="basket-review-action"><div className="basket-summary"><span>Estimated produce subtotal</span><strong>{formatNaira(total)}</strong></div>
            <p className="basket-note" id="basket-request-note">Final quantity, availability and fulfilment will be confirmed after you submit your request.</p>
            <button className="checkout-button" type="button" onClick={showDetails}>{receipt ? "View recorded request" : "Continue to request details"}</button></div>
          </>
        )}
        </div>
        <div className="drawer-step" hidden={!detailsOpen}>
          {receipt ? <RequestRecorded receipt={receipt} storageFailed={storageFailed} onStartAnother={startAnother} /> :
            <OrderRequestForm products={products} quantities={quantities} active={detailsOpen} onEditBasket={showReview} onRecorded={record} isCurrentRequest={() => requestGeneration.current === generation} />}
        </div>
      </aside>
    </div>
  );
}
