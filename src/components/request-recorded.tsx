"use client";

import { useState } from "react";
import { formatNaira } from "@/data/products";
import type { RecordedReceipt } from "@/lib/orders/contract";

export function RequestRecorded({ receipt, storageFailed, onStartAnother }: {
  receipt: RecordedReceipt; storageFailed: boolean; onStartAnother: () => string | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const total = receipt.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fulfilment = receipt.fulfilment && { pickup: "Pickup", delivery: "Delivery", to_confirm: "I need guidance" }[receipt.fulfilment];
  return (
    <section className="recorded-request" aria-label="Recorded request">
      <div className="request-scroll">
        <p className="recorded-kicker">Thank you for choosing Zadok Farm.</p>
        <p className="recorded-reference-label">Your request reference</p>
        <p className="recorded-reference">{receipt.reference}</p>
        <p id="recorded-note">Your request is recorded. Availability, fulfilment and payment are not confirmed.</p>
        <section className="recorded-items" aria-labelledby="recorded-produce-title">
          <h3 id="recorded-produce-title">Produce requested</h3>
          <ul>{receipt.items.map((item, index) => <li key={index}>
            <div><strong>{item.name}</strong><span>{item.quantity} × {item.unit} · {formatNaira(item.price)} per {item.unit}</span></div>
            <strong>{formatNaira(item.price * item.quantity)}</strong>
          </li>)}</ul>
          <div className="recorded-subtotal"><span>Estimated produce subtotal</span><strong>{formatNaira(total)}</strong></div>
          <p className="basket-note">These are the items recorded with your request. Estimates are not final prices or an amount due.</p>
        </section>
        <section className="recorded-fulfilment" aria-labelledby="recorded-fulfilment-title">
          <h3 id="recorded-fulfilment-title">Fulfilment preference</h3>
          <p>{fulfilment ?? "Not available in this saved confirmation."}</p>
          {receipt.fulfilment === "delivery" && <><h4>Delivery address</h4><p className="recorded-address">{receipt.delivery_address || "Not available in this saved confirmation."}</p></>}
          <p className="basket-note">Zadok will confirm what can be arranged.</p>
        </section>
        <p className="draft-note">Keep your reference for follow-up. Starting another request keeps your basket and does not cancel this request.</p>
        {storageFailed && <p className="field-error">We could not save this confirmation in your tab. Keep your reference before closing or refreshing.</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="start-another-request" type="button" onClick={() => setError(onStartAnother())}>Start another request</button>
      </div>
      <div className="request-action recorded-action">
        {receipt.whatsappUrl ? <>
          <p className="basket-note" id="whatsapp-next-step">Next, open WhatsApp and send the prepared message so Zadok can follow up. Opening WhatsApp does not send it.</p>
          <a className="checkout-button whatsapp-handoff" href={receipt.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-describedby="whatsapp-next-step">Continue on WhatsApp<span className="sr-only"> (opens in a new tab or window)</span></a>
        </> : <p className="basket-note">Your request is recorded, but the WhatsApp link is unavailable. Keep your reference to share when you contact Zadok. You do not need to submit this request again.</p>}
      </div>
    </section>
  );
}
