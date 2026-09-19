"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { RequestSummary } from "@/components/request-summary";
import { FulfilmentChoices } from "@/components/fulfilment-choices";
import type { Product } from "@/data/products";
import { callingCountries, canonicalPhone, emptyPhone, restorePhone, restorePhoneDraft, type PhoneInput } from "@/lib/phone-input";
import { orderDetailsSchema, orderRequestSchema, receiptSchema, type OrderRequest, type OrderReceipt } from "@/lib/orders/contract";

const draftSchema = z.object({
  name: z.string().max(120), phone: z.string().max(30),
  fulfilment: z.enum(["pickup", "delivery", "to_confirm"]),
  delivery_address: z.string().max(500), note: z.string().max(500),
});
const emptyDetails: z.infer<typeof draftSchema> = { name: "", phone: "", fulfilment: "to_confirm", delivery_address: "", note: "" };
const STORAGE_KEY = "zadok-request-attempt-v1";
const fieldCopy: Record<string, string> = {
  "details.name": "Enter the name we should use for this request.",
  "details.phone": "Enter your WhatsApp number and check the country calling code.",
  "details.delivery_address": "Add a delivery address so Zadok can review the request.",
};

export function OrderRequestForm({ products, quantities, active, onEditBasket }: { products: Product[]; quantities: Record<string, number>; active: boolean; onEditBasket: () => void }) {
  const [details, setDetails] = useState(emptyDetails);
  const [phoneInput, setPhoneInput] = useState(emptyPhone);
  const [attempt, setAttempt] = useState<OrderRequest | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const [keyConflict, setKeyConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const busy = useRef(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const scrollRegion = useRef<HTMLDivElement>(null);
  const focusInvalid = useRef(false);

  useEffect(() => {
    if (!active || !focusInvalid.current) return;
    focusInvalid.current = false;
    // DOM order is name, phone, native fulfilment radios, conditional address, note.
    // Focus announces the associated inline description without a second live alert.
    const region = scrollRegion.current;
    const field = region?.querySelector<HTMLElement>('[aria-invalid="true"]:not(:disabled)');
    if (!region || !field) return;
    const errorHeight = field.nextElementSibling?.getBoundingClientRect().height ?? 0;
    const topSpace = Math.max(8, Math.min(56, region.clientHeight - field.offsetHeight - errorHeight - 16));
    region.scrollTo?.({ top: region.scrollTop + field.getBoundingClientRect().top - region.getBoundingClientRect().top - topSpace, behavior: "instant" });
    field.focus({ preventScroll: true });
  }, [active, errors]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
        const savedReceipt = receiptSchema.safeParse(stored?.receipt);
        const savedAttempt = orderRequestSchema.safeParse(stored?.attempt);
        if (savedReceipt.success) setReceipt(savedReceipt.data);
        else if (draftSchema.safeParse(stored?.draft).success) {
          const draft = draftSchema.parse(stored.draft);
          setDetails(draft);
          setPhoneInput(restorePhoneDraft(draft.phone, stored.phoneInput));
        }
        else if (savedAttempt.success) {
          setAttempt(savedAttempt.data);
          setKeyConflict(stored.conflict === true);
          setDetails(savedAttempt.data.details);
          setPhoneInput(restorePhone(savedAttempt.data.details.phone));
          setMessage(stored.conflict === true ? "The saved request no longer matches its original reference key. Review your details before starting a new request." : "An unfinished request is saved in this tab. Retry it to check whether it was accepted.");
        }
      } catch { /* Submission checks storage before sending anything. */ }
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (active && (message || receipt)) {
      // A basket rejection can coexist with contact errors; field focus takes priority.
      if (!receipt && scrollRegion.current?.querySelector('[aria-invalid="true"]:not(:disabled)')) return;
      feedback.current?.focus({ preventScroll: true });
      feedback.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [active, message, receipt]);

  function updateDetails(next: typeof details, nextPhone = phoneInput) {
    setDetails(next);
    const checked = orderDetailsSchema.safeParse(next);
    const invalid = new Set(checked.success ? [] : checked.error.issues.map((issue) => `details.${String(issue.path[0])}`));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => {
      const field = key.slice("details.".length) as keyof typeof details;
      return !(next[field] !== details[field] && !invalid.has(key)) &&
        !(key === "details.delivery_address" && next.fulfilment !== "delivery");
    })));
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: next, phoneInput: nextPhone })); }
    catch { /* Submission will fail closed if retry storage is unavailable. */ }
  }

  function updatePhone(next: PhoneInput) {
    const canonical = canonicalPhone(next);
    const input = next.national.trim().startsWith("+") && canonical
      ? restorePhone(canonical, next.country) : next;
    setPhoneInput(input);
    updateDetails({ ...details, phone: canonical }, input);
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
    setPhoneInput(restorePhone(attempt.details.phone));
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
      focusInvalid.current = true;
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => {
        const key = issue.path.join(".");
        return [key, issue.code === "too_big" ? issue.message : fieldCopy[key] ?? issue.message];
      })));
      setMessage(parsed.error.issues.some((issue) => issue.path[0] === "items")
        ? "Your basket needs review. Return to your basket and check its produce and quantities." : "");
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
        setPhoneInput(emptyPhone);
        // Replace the retry payload with a receipt; no name or phone remains in storage.
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ receipt: accepted.data })); }
        catch { sessionStorage.removeItem(STORAGE_KEY); }
        return;
      }
      // Only definitive pre-commit rejections permit editing. An unknown outcome keeps the same payload/key.
      if ([409, 422, 429].includes(response.status) && "code" in data && data.code !== "key_conflict") {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ draft: details, phoneInput }));
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
      <div className="request-scroll" ref={scrollRegion}>
      <RequestSummary items={summaryItems} saved={!!attempt} recorded={!!receipt} onEdit={onEditBasket} />
      <p className="basket-note request-intro" id="order-details-note">Tell us how to reach you and how you would prefer to receive your produce. This is a request, not a completed purchase.</p>
      <fieldset className="request-fields" disabled={!ready || pending || !!attempt || !!receipt} aria-describedby="order-details-note">
        <section className="request-contact" aria-labelledby="contact-title">
        <h3 id="contact-title">Your contact details</h3>
        <div className="contact-fields"><div>
        <label htmlFor="order-name">Full name</label>
        <input id="order-name" name="name" value={details.name} onChange={(event) => updateDetails({ ...details, name: event.target.value })} autoComplete="name" required maxLength={120} aria-invalid={!!errors["details.name"]} aria-describedby={errors["details.name"] ? "order-name-error" : undefined} />
        {errors["details.name"] && <p className="field-error" id="order-name-error">{errors["details.name"]}</p>}
        </div></div>
        <div className="phone-fields">
        <div>
        <label htmlFor="order-country">Country calling code</label>
        <select id="order-country" name="phone_country" autoComplete="tel-country-code" value={phoneInput.country}
          onChange={(event) => updatePhone({ country: event.target.value, national: phoneInput.country === "" ? "" : phoneInput.national })}>
          {phoneInput.country === "" && <option value="">Saved international number</option>}
          {callingCountries.map((country) => <option key={country.id} value={country.id}>{country.name} (+{country.callingCode})</option>)}
        </select>
        </div><div>
        <label htmlFor="order-phone">WhatsApp number</label>
        <input id="order-phone" name="phone" value={phoneInput.national} onChange={(event) => updatePhone({ ...phoneInput, national: event.target.value })} type="tel" inputMode="tel" autoComplete="tel-national" required maxLength={30} placeholder={phoneInput.country === "NG" ? "0801 234 5678" : undefined} aria-invalid={!!errors["details.phone"]} aria-describedby={`order-phone-help${errors["details.phone"] ? " order-phone-error" : ""}`} />
        {errors["details.phone"] && <p className="field-error" id="order-phone-error">{errors["details.phone"]}</p>}
        </div></div>
        <p className="basket-note phone-help" id="order-phone-help">{phoneInput.country === "" ? "Your saved international number is preserved. Choose a country to enter a different number." : "Enter your number as you dial it locally, including the area code. You can also paste a full international number."}</p>
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
