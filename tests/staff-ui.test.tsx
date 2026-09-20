import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OrdersList, OrderDetails, DeskShell, DeskMessage } from "../src/components/staff/orders";
import type { OrderDetail } from "../src/lib/staff/orders";
const order: OrderDetail = {
  id: "11111111-1111-4111-8111-111111111111", reference: "ZF-20260920-A2B3C4", requested_at: "2026-09-20T10:00:00Z", status: "submitted", fulfilment_method: "delivery",
  delivery_address: "12 Synthetic Street", customer_note: "Call before arriving <script>alert(1)</script>", customers: { full_name: "Synthetic Customer", phone: "+12025550123" },
  order_items: [{ id: "item-1", product_name: "Recorded cucumber", quantity: 2, selling_unit: "crate", unit_price_ngn: 3200 }],
  order_status_events: [{ to_status: "submitted", created_at: "2026-09-20T10:00:00Z" }],
};
describe("read-only staff presentation", () => {
  it("renders semantic mobile-ready request rows without contact data in links", () => {
    const html = renderToStaticMarkup(<OrdersList orders={[order]} />);
    expect(html).toContain(order.reference); expect(html).toContain("Synthetic Customer"); expect(html).toContain("6,400");
    expect(html).toContain("1 item"); expect(html).toContain("Delivery"); expect(html).toContain("11:00");
    expect(html).toContain(`/staff/orders/${order.id}`);
    expect(html).not.toContain(order.customers!.phone); expect(html).not.toContain(order.delivery_address!);
  });
  it("shows server snapshots, safe escaped notes, contact and submitted event without mutation controls", () => {
    const html = renderToStaticMarkup(<OrderDetails order={order} />);
    for (const value of [order.reference, "Recorded cucumber", "6,400", "Estimated subtotal", order.customers!.phone, order.delivery_address!, "Request recorded", "read-only"]) expect(html).toContain(value);
    expect(html).toContain("&lt;script&gt;"); expect(html).not.toContain("<script>");
    expect(html).not.toMatch(/<button|<input|<form|href="(?:tel:|https:\/\/wa.me)/);
  });
  it("hides inapplicable addresses and states missing notes/events honestly", () => {
    const html = renderToStaticMarkup(<OrderDetails order={{ ...order, fulfilment_method: "pickup", customer_note: null, order_status_events: [] }} />);
    expect(html).not.toContain(order.delivery_address!); expect(html).toContain("No note provided"); expect(html).toContain("submitted event is unavailable");
  });
  it("contains only real Orders navigation, identity and POST sign-out", () => {
    const html = renderToStaticMarkup(<DeskShell staff={{ id: "staff", full_name: "Staff Fixture" }}><DeskMessage title="No requests yet">Requests appear after submission.</DeskMessage></DeskShell>);
    expect(html).toContain("Staff Fixture"); expect(html).toContain('action="/staff/sign-out" method="post"');
    expect(html).toContain("Skip to orders"); expect(html).not.toMatch(/Inventory|Settings|Analytics/);
  });
});
