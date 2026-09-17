"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Product } from "@/data/products";
import { orderRequestSchema, receiptSchema, type OrderRequest, type OrderReceipt } from "@/lib/orders/contract";

const STORAGE_KEY = "zadok-request-attempt-v1";

export function OrderRequestForm({ products, quantities }: { products: Product[]; quantities: Record<string, number> }) {
  const [attempt, setAttempt] = useState<OrderRequest | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
        const savedReceipt = receiptSchema.safeParse(stored?.receipt);
        const savedAttempt = orderRequestSchema.safeParse(stored?.attempt);
        if (savedReceipt.success) setReceipt(savedReceipt.data);
        else if (savedAttempt.success) {
          setAttempt(savedAttempt.data);
          setMessage("An unfinished request is saved in this tab. Retry it to check whether it was accepted.");
        }
      } catch { /* Submission checks storage before sending anything. */ }
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => { if (message || receipt) feedback.current?.focus(); }, [message, receipt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || receipt) return;
    const form = new FormData(event.currentTarget);
    const parsed = orderRequestSchema.safeParse(attempt ?? {
      key: crypto.randomUUID(),
      details: { name: form.get("name"), phone: form.get("phone"), fulfilment: form.get("fulfilment") },
      items: products.filter((product) => quantities[product.id] > 0).map((product) => ({
        slug: product.id, quantity: quantities[product.id], expectedPrice: product.price,
        expectedName: product.name, expectedUnit: product.unit,
      })),
    });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path.join("."), issue.message])));
      setMessage("Check the highlighted details and your basket.");
      return;
    }
    const submitted = parsed.data;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ attempt: submitted }));
    } catch {
      setMessage("Allow storage for this tab before submitting, so an interrupted request can be retried safely.");
      return;
    }
    busy.current = true;
    setAttempt(submitted);
    setPending(true);
    setErrors({});
    setMessage("");
    try {
      const response = await fetch("/api/order-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted), signal: AbortSignal.timeout(20000),
      });
      const result: unknown = await response.json();
      const data = result && typeof result === "object" ? result : {};
      const accepted = receiptSchema.safeParse("receipt" in data ? data.receipt : null);
      if (response.ok && accepted.success) {
        setReceipt(accepted.data);
        // Replace the retry payload with a receipt; no name or phone remains in storage.
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ receipt: accepted.data })); }
        catch { sessionStorage.removeItem(STORAGE_KEY); }
        return;
      }
      // Only definitive pre-commit rejections permit editing. An unknown outcome keeps the same payload/key.
      if ([409, 422, 429].includes(response.status) && "code" in data && data.code !== "key_conflict") {
        sessionStorage.removeItem(STORAGE_KEY);
        setAttempt(null);
      }
      setMessage("message" in data && typeof data.message === "string" ? data.message : "Submission could not be verified. Retry the same request safely.");
    } catch {
      setMessage("Connection interrupted. Your basket is safe. Retry this same request to recover its reference without creating a duplicate.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form className="order-request-form" onSubmit={submit} noValidate aria-busy={pending}>
      <h3>Your request details</h3>
      <p className="basket-note" id="order-details-note">We use your name and WhatsApp number to discuss this request. Availability, payment and fulfilment need staff confirmation. Unfinished details stay in this tab for safe retries.</p>
      <fieldset disabled={!ready || pending || !!attempt || !!receipt} aria-describedby="order-details-note">
        <label htmlFor="order-name">Your name</label>
        <input id="order-name" name="name" autoComplete="name" required maxLength={120} aria-invalid={!!errors["details.name"]} aria-describedby={errors["details.name"] ? "order-name-error" : undefined} />
        {errors["details.name"] && <p className="field-error" id="order-name-error">{errors["details.name"]}</p>}
        <label htmlFor="order-phone">WhatsApp number (with country code)</label>
        <input id="order-phone" name="phone" type="tel" autoComplete="tel" required maxLength={30} placeholder="+2348012345678" aria-invalid={!!errors["details.phone"]} aria-describedby={errors["details.phone"] ? "order-phone-error" : undefined} />
        {errors["details.phone"] && <p className="field-error" id="order-phone-error">{errors["details.phone"]}</p>}
        <label htmlFor="order-fulfilment">Fulfilment preference</label>
        <select id="order-fulfilment" name="fulfilment" defaultValue="to_confirm">
          <option value="to_confirm">Discuss with Zadok</option>
          <option value="pickup">Pickup preferred</option>
          <option value="delivery">Delivery preferred — subject to confirmation</option>
        </select>
      </fieldset>
      {attempt && !receipt && <p className="basket-note">Retrying the saved request for {attempt.details.name}: {attempt.items.map((item) => `${item.quantity} × ${item.expectedName}`).join(", ")}. Later basket changes are not included.</p>}
      <p ref={feedback} tabIndex={-1} role={receipt ? "status" : "alert"} className="request-feedback">
        {receipt ? `Request recorded: ${receipt.reference}. Availability and payment are not confirmed.` : message}
      </p>
      <button className="checkout-button" disabled={!ready || pending || !!receipt} type="submit">
        {pending ? "Submitting request…" : receipt ? "Request recorded" : attempt ? "Retry saved request" : "Submit request"}
      </button>
    </form>
  );
}
