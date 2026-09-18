"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { RequestSummary } from "@/components/request-summary";
import { FulfilmentChoices } from "@/components/fulfilment-choices";
import type { Product } from "@/data/products";
import { orderRequestSchema, receiptSchema, type OrderRequest, type OrderReceipt } from "@/lib/orders/contract";

const draftSchema = z.object({
  name: z.string().max(120), phone: z.string().max(30),
  fulfilment: z.enum(["pickup", "delivery", "to_confirm"]),
  delivery_address: z.string().max(500), note: z.string().max(500),
});
const emptyDetails: z.infer<typeof draftSchema> = { name: "", phone: "", fulfilment: "to_confirm", delivery_address: "", note: "" };
const STORAGE_KEY = "zadok-request-attempt-v1";

export function OrderRequestForm({ products, quantities, active, onEditBasket }: { products: Product[]; quantities: Record<string, number>; active: boolean; onEditBasket: () => void }) {
  const [details, setDetails] = useState(emptyDetails);
  const [attempt, setAttempt] = useState<OrderRequest | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [keyConflict, setKeyConflict] = useState(false);
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
          setKeyConflict(stored.conflict === true);
          setDetails(savedAttempt.data.details);
          setMessage(stored.conflict === true ? "The saved request no longer matches its original reference key. Review your details before starting a new request." : "An unfinished request is saved in this tab. Retry it to check whether it was accepted.");
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

  function recoverConflict() {
    if (!keyConflict || !attempt || pending || receipt) return;
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
      if (stored?.receipt || (stored?.attempt && stored.attempt.key !== attempt.key)) {
        setMessage("The saved request has changed. Close and reopen the basket to recover it safely.");
        return;
      }
      // Replace only this unresolved attempt with its editable details, never clear tab storage.
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: attempt.details }));
    } catch {
      setMessage("We could not update the saved request. Allow storage for this tab and try again.");
      return;
    }
    setDetails(attempt.details);
    setAttempt(null);
    setKeyConflict(false);
    setErrors({});
    setMessage("Saved retry cleared. Review your details and current basket before submitting a new request.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || receipt || keyConflict) return;

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
      if (response.status === 409 && "code" in data && data.code === "key_conflict") {
        setKeyConflict(true);
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ attempt: submitted, conflict: true })); }
        catch { /* Keep the in-memory attempt; reopening can retry to recover this response. */ }
        setMessage("The saved request no longer matches its original reference key. Review your details before starting a new request. This does not cancel any previously recorded request.");
        return;
      }
      if (response.status === 429 && "code" in data && data.code === "rate_limited") {
        setMessage("Too many requests. Please wait up to 15 minutes before trying again. Your details are saved.");
        return;
      }
      setMessage("message" in data && typeof data.message === "string" ? data.message : "Submission could not be verified. Retry the same request safely.");
    } catch {
      setMessage("Connection interrupted. Your basket is safe. Retry this same request to recover its reference without creating a duplicate.");
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  const summaryItems = receipt?.items ?? (attempt
    ? attempt.items.map((item) => ({ name: item.expectedName, unit: item.expectedUnit, price: item.expectedPrice, quantity: item.quantity }))
    : products.filter((product) => quantities[product.id] > 0).map((product) => ({ name: product.name, unit: product.unit, price: product.price, quantity: quantities[product.id] })));

  return (
    <form className="order-request-form" onSubmit={submit} noValidate aria-busy={pending}>
      <div className="request-scroll">
      <RequestSummary items={summaryItems} saved={!!attempt} recorded={!!receipt} onEdit={onEditBasket} />
      <p className="basket-note request-intro" id="order-details-note">Tell us how to reach you and how you would prefer to receive your produce. This is a request, not a completed purchase.</p>
      <fieldset className="request-fields" disabled={!ready || pending || !!attempt || !!receipt} aria-describedby="order-details-note">
        <section className="request-contact" aria-labelledby="contact-title">
        <h3 id="contact-title">Your contact details</h3>
        <div className="contact-fields"><div>
        <label htmlFor="order-name">Full name</label>
        <input id="order-name" name="name" value={details.name} onChange={(event) => updateDetails({ ...details, name: event.target.value })} autoComplete="name" required maxLength={120} aria-invalid={!!errors["details.name"]} aria-describedby={errors["details.name"] ? "order-name-error" : undefined} />
        {errors["details.name"] && <p className="field-error" id="order-name-error">{errors["details.name"]}</p>}
        </div><div>
        <label htmlFor="order-phone">WhatsApp number (with country code)</label>
        <input id="order-phone" name="phone" value={details.phone} onChange={(event) => updateDetails({ ...details, phone: event.target.value })} type="tel" autoComplete="tel" required maxLength={30} placeholder="+2348012345678" aria-invalid={!!errors["details.phone"]} aria-describedby={errors["details.phone"] ? "order-phone-error" : undefined} />
        {errors["details.phone"] && <p className="field-error" id="order-phone-error">{errors["details.phone"]}</p>}
        </div></div>
        </section>
        <FulfilmentChoices value={details.fulfilment} onChange={(fulfilment) => updateDetails({ ...details, fulfilment })} />
        {details.fulfilment === "delivery" && <section className="delivery-fields" aria-labelledby="address-label">
          <label id="address-label" htmlFor="order-address">Delivery address</label>
          <p className="basket-note" id="order-address-help">Include your house/building, street, area, city/state and a nearby landmark.</p>
          <textarea id="order-address" name="delivery_address" autoComplete="street-address" required maxLength={500} rows={4}
            value={details.delivery_address} onChange={(event) => updateDetails({ ...details, delivery_address: event.target.value })}
            aria-invalid={!!errors["details.delivery_address"]} aria-describedby={`order-address-help${errors["details.delivery_address"] ? " order-address-error" : ""}`} />
          {errors["details.delivery_address"] && <p className="field-error" id="order-address-error">{errors["details.delivery_address"]}</p>}
        </section>}
        <div className="request-note">
        <label htmlFor="order-note">Note for Zadok (optional)</label>
        <textarea id="order-note" name="note" maxLength={500} rows={2} value={details.note}
          onChange={(event) => updateDetails({ ...details, note: event.target.value })}
          aria-invalid={!!errors["details.note"]} aria-describedby={errors["details.note"] ? "order-note-error" : undefined} />
        {errors["details.note"] && <p className="field-error" id="order-note-error">{errors["details.note"]}</p>}
        </div>
      </fieldset>
      {attempt && !receipt && <p className="basket-note">Details are locked while this saved request is unresolved, so retrying cannot change what was submitted.</p>}
      <p ref={feedback} tabIndex={-1} role={receipt ? "status" : "alert"} className="request-feedback">
        {receipt ? `Request recorded: ${receipt.reference}. Availability, fulfilment and payment are not confirmed.` : message}
      </p>
      {keyConflict && !receipt && <button className="conflict-recovery" type="button" onClick={recoverConflict}>Clear saved retry and review details</button>}
      <p className="draft-note">Unfinished details stay in this tab for safe retries.</p>
      </div>
      <div className="request-action">
      <p className="basket-note">Zadok confirms availability and fulfilment, then shares payment details on WhatsApp afterward.</p>
      <span className="sr-only" role="status">{pending ? "Submitting request…" : ""}</span>
      <button className="checkout-button" disabled={!ready || pending || !!receipt || keyConflict} type="submit">
        {pending ? "Submitting request…" : receipt ? "Request recorded" : attempt ? "Retry saved request" : "Submit request"}
      </button></div>
    </form>
  );
}
