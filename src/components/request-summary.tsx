import { formatNaira } from "@/data/products";

type SummaryItem = { name: string; unit: string; price: number; quantity: number };

export function RequestSummary({ items, saved, recorded, onEdit }: {
  items: SummaryItem[]; saved: boolean; recorded: boolean; onEdit: () => void;
}) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <section className="request-summary" aria-label={recorded ? "Recorded request summary" : saved ? "Saved request summary" : "Current basket summary"}>
      <div className="request-summary-heading">
        <p className="eyebrow">{recorded ? "RECORDED REQUEST" : saved ? "SAVED REQUEST" : "YOUR PRODUCE"}</p>
        {!saved && !recorded && <button type="button" onClick={onEdit}>Edit basket</button>}
      </div>
      <details>
        <summary><span>{items.length} produce {items.length === 1 ? "line" : "lines"} <span className="summary-disclosure">· View items</span></span><strong>{formatNaira(total)}</strong></summary>
        <ul>{items.map((item, index) => <li key={`${item.name}-${index}`}><span>{item.quantity} × {item.name}<small>{formatNaira(item.price)} / {item.unit}</small></span><strong>{formatNaira(item.price * item.quantity)}</strong></li>)}</ul>
      </details>
      <p className="basket-note">Estimated produce subtotal. Availability and payment remain subject to confirmation.</p>
      {saved && !recorded && <p className="saved-request-note">This is the saved request being retried. Later basket changes are not included.</p>}
    </section>
  );
}
