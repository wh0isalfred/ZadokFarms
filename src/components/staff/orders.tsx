import type { Staff } from "@/lib/staff/access";
import type { OrderList, OrderDetail } from "@/lib/staff/orders";
import { formatNaira } from "@/data/products";
import { DeskPrivacy } from "./desk-privacy";

export function DeskShell({ staff, children }: { staff: Staff; children: React.ReactNode }) {
  return <div className="desk-shell desk-private"><DeskPrivacy /><a className="desk-skip" href="#desk-main">Skip to orders</a>
    <aside className="desk-rail"><a className="desk-wordmark" href="/staff/orders">Zadok <span>Desk</span></a><p className="desk-rail-label">FARM OPERATIONS</p><nav aria-label="Staff workspace"><a className="desk-nav-active" href="/staff/orders" aria-current="page"><span aria-hidden="true">▤</span> Orders</a></nav><p className="desk-rail-note">Care in every request.</p></aside>
    <div className="desk-work"><header className="desk-topbar"><span className="desk-topbar-label">Staff workspace</span><div className="desk-identity"><span>{staff.full_name}</span><form method="post" action="/staff/sign-out"><button type="submit">Sign out</button></form></div></header><main id="desk-main" className="desk-main">{children}</main></div>
  </div>;
}
const dateFormat = new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
export function DeskTime({ value }: { value: string }) { return <time dateTime={value}>{dateFormat.format(new Date(value))}</time>; }
export function fulfilment(value: string | null) { return ({ pickup: "Pickup", delivery: "Delivery", to_confirm: "Needs guidance" }[value ?? ""] ?? "Not specified"); }
export function estimate(items: { quantity: number; unit_price_ngn: number }[]) { return items.reduce((total, item) => total + item.quantity * item.unit_price_ngn, 0); }
export function OrdersList({ orders }: { orders: OrderList }) {
  return <><div className="desk-list-labels" aria-hidden="true"><span>Request / customer</span><span>Submitted · Lagos time</span><span>Produce estimate</span><span>Preference</span></div><ul className="desk-order-list">{orders.map((order) => <li key={order.id}><a className="desk-order-row" href={`/staff/orders/${order.id}`}>
    <div className="desk-order-customer"><span className="desk-reference">{order.reference}</span><strong>{order.customers?.full_name ?? "Customer unavailable"}</strong></div>
    <div className="desk-order-time"><DeskTime value={order.requested_at} /><span className="desk-muted">{order.status.replaceAll("_", " ")}</span></div>
    <div className="desk-order-estimate"><strong>{formatNaira(estimate(order.order_items))}</strong><span className="desk-muted">{order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}</span></div>
    <div className="desk-order-cue"><span>{fulfilment(order.fulfilment_method)}</span><span aria-hidden="true">↗</span></div>
  </a></li>)}</ul></>;
}
export function OrderDetails({ order }: { order: OrderDetail }) {
  const submitted = order.order_status_events.filter((event) => event.to_status === "submitted").sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
  return <><a className="desk-back" href="/staff/orders">← All orders</a><div className="desk-page-heading"><div><p className="desk-eyebrow">REQUEST DETAILS</p><h1 className="desk-detail-reference">{order.reference}</h1><p className="desk-muted">Submitted <DeskTime value={order.requested_at} /> · Lagos time</p></div><span className="desk-status">{order.status.replaceAll("_", " ")}</span></div>
    <p className="desk-context">A customer request. Estimates are not final prices; submission does not confirm availability or payment.</p>
    <div className="desk-detail-grid"><section className="desk-produce"><h2>Requested produce</h2><ul className="desk-detail-items">{order.order_items.map((item) => <li key={item.id}><div><strong>{item.product_name}</strong><span>{item.quantity} × {item.selling_unit} · {formatNaira(item.unit_price_ngn)} per {item.selling_unit}</span></div><strong>{formatNaira(item.quantity * item.unit_price_ngn)}</strong></li>)}</ul><div className="desk-total"><span>Estimated subtotal</span><strong>{formatNaira(estimate(order.order_items))}</strong></div><p className="desk-muted">Item names, quantities and prices as recorded at submission.</p>
      <section className="desk-detail-section"><h2>Request note</h2><p className="desk-long-copy">{order.customer_note || "No note provided."}</p></section>
      <section className="desk-detail-section"><h2>Submitted request</h2>{submitted ? <p className="desk-event"><span aria-hidden="true">●</span> Request recorded <DeskTime value={submitted.created_at} /></p> : <p className="desk-muted">The submitted event is unavailable.</p>}</section>
    </section><div className="desk-contact-column"><section><h2>Customer</h2><dl><dt>Name</dt><dd>{order.customers?.full_name ?? "Unavailable"}</dd><dt>WhatsApp number</dt><dd>{order.customers?.phone ?? "Unavailable"}</dd></dl></section><section className="desk-detail-section"><h2>Fulfilment preference</h2><p>{fulfilment(order.fulfilment_method)}</p>{order.fulfilment_method === "delivery" && <><h3>Delivery address</h3><p className="desk-long-copy">{order.delivery_address ?? "Unavailable"}</p></>}</section><p className="desk-readonly">This desk is read-only. Review the request here; no order details or status can be changed.</p></div></div>
  </>;
}
export function DeskMessage({ title, children }: { title: string; children: React.ReactNode }) { return <section className="desk-empty"><span className="desk-empty-mark" aria-hidden="true">↗</span><h2>{title}</h2><p>{children}</p></section>; }
