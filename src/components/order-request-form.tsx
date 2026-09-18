"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import type { Product } from "@/data/products";
import { orderRequestSchema, receiptSchema, type OrderRequest, type OrderReceipt } from "@/lib/orders/contract";

const draftSchema = z.object({
  name: z.string().max(120), phone: z.string().max(30),
  fulfilment: z.enum(["pickup", "delivery", "to_confirm"]),
  delivery_address: z.string().max(500), note: z.string().max(500),
});
const emptyDetails: z.infer<typeof draftSchema> = { name: "", phone: "", fulfilment: "to_confirm", delivery_address: "", note: "" };
const STORAGE_KEY = "zadok-request-attempt-v1";

export function OrderRequestForm({ products, quantities, active }: { products: Product[]; quantities: Record<string, number>; active: boolean }) {
  const [details, setDetails] = useState(emptyDetails);
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
        else if (draftSchema.safeParse(stored?.draft).success) setDetails(draftSchema.parse(stored.draft));
        else if (savedAttempt.success) {
          setAttempt(savedAttempt.data);
          setDetails(savedAttempt.data.details);
          setMessage("An unfinished request is saved in this tab. Retry it to check whether it was accepted.");
        }
      } catch { /* Submission checks storage before sending anything. */ }
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (active && (message || receipt)) {
      feedback.current?.focus({ preventScroll: true });
      feedback.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [active, message, receipt]);

  function updateDetails(next: typeof details) {
    setDetails(next);
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: next })); }
    catch { /* Submission will fail closed if retry storage is unavailable. */ }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || receipt) return;

    const parsed = orderRequestSchema.safeParse(attempt ?? {
      key: crypto.randomUUID(),
      details,
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
        setDetails(emptyDetails);
        // Replace the retry payload with a receipt; no name or phone remains in storage.
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ receipt: accepted.data })); }
        catch { sessionStorage.removeItem(STORAGE_KEY); }
        return;
      }
      // Only definitive pre-commit rejections permit editing. An unknown outcome keeps the same payload/key.
      if ([409, 422, 429].includes(response.status) && "code" in data && data.code !== "key_conflict") {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: details }));
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
      <p className="basket-note" id="order-details-note">Zadok confirms availability and fulfilment, then shares payment details on WhatsApp afterward. This is a request, not a completed purchase. Unfinished details stay in this tab for safe retries.</p>
      <fieldset disabled={!ready || pending || !!attempt || !!receipt} aria-describedby="order-details-note">
        <label htmlFor="order-name">Full name</label>
        <input id="order-name" name="name" value={details.name} onChange={(event) => updateDetails({ ...details, name: event.target.value })} autoComplete="name" required maxLength={120} aria-invalid={!!errors["details.name"]} aria-describedby={errors["details.name"] ? "order-name-error" : undefined} />
        {errors["details.name"] && <p className="field-error" id="order-name-error">{errors["details.name"]}</p>}
        <label htmlFor="order-phone">WhatsApp number (with country code)</label>
        <input id="order-phone" name="phone" value={details.phone} onChange={(event) => updateDetails({ ...details, phone: event.target.value })} type="tel" autoComplete="tel" required maxLength={30} placeholder="+2348012345678" aria-invalid={!!errors["details.phone"]} aria-describedby={errors["details.phone"] ? "order-phone-error" : undefined} />
        {errors["details.phone"] && <p className="field-error" id="order-phone-error">{errors["details.phone"]}</p>}
        <label htmlFor="order-fulfilment">Fulfilment preference</label>
        <select id="order-fulfilment" name="fulfilment" required value={details.fulfilment} onChange={(event) => updateDetails({ ...details, fulfilment: event.target.value as typeof details.fulfilment })}>
          <option value="to_confirm">I need guidance</option>
          <option value="pickup">Pickup preferred</option>
          <option value="delivery">Delivery preferred — subject to confirmation</option>
        </select>
        {details.fulfilment === "delivery" && <>
          <label htmlFor="order-address">Delivery address</label>
          <p className="basket-note" id="order-address-help">Include your house/building, street, area, city/state and a nearby landmark.</p>
          <textarea id="order-address" name="delivery_address" autoComplete="street-address" required maxLength={500} rows={4}
            value={details.delivery_address} onChange={(event) => updateDetails({ ...details, delivery_address: event.target.value })}
            aria-invalid={!!errors["details.delivery_address"]} aria-describedby={`order-address-help${errors["details.delivery_address"] ? " order-address-error" : ""}`} />
          {errors["details.delivery_address"] && <p className="field-error" id="order-address-error">{errors["details.delivery_address"]}</p>}
        </>}
        <label htmlFor="order-note">Note for Zadok (optional)</label>
        <textarea id="order-note" name="note" maxLength={500} rows={2} value={details.note}
          onChange={(event) => updateDetails({ ...details, note: event.target.value })}
          aria-invalid={!!errors["details.note"]} aria-describedby={errors["details.note"] ? "order-note-error" : undefined} />
        {errors["details.note"] && <p className="field-error" id="order-note-error">{errors["details.note"]}</p>}
      </fieldset>
      {attempt && !receipt && <p className="basket-note">Retrying the saved request for {attempt.details.name}: {attempt.items.map((item) => `${item.quantity} × ${item.expectedName}`).join(", ")}. Later basket changes are not included.</p>}
      <p ref={feedback} tabIndex={-1} role={receipt ? "status" : "alert"} className="request-feedback">
        {receipt ? `Request recorded: ${receipt.reference}. Availability, fulfilment and payment are not confirmed.` : message}
      </p>
      <div className="request-action"><button className="checkout-button" disabled={!ready || pending || !!receipt} type="submit">
        {pending ? "Submitting request…" : receipt ? "Request recorded" : attempt ? "Retry saved request" : "Submit request"}
      </button></div>
    </form>
  );
}
