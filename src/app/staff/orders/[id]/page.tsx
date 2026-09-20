import { deskClient, requireAccess } from "@/lib/staff/pages";
import { readOrder } from "@/lib/staff/orders";
import { DeskShell, OrderDetails, DeskMessage } from "@/components/staff/orders";
export default async function Order({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await readOrder(await deskClient(), id);
  const staff = requireAccess(result.access, `/staff/orders/${id}`);
  return <DeskShell staff={staff}>{result.order ? <OrderDetails order={result.order} /> : <><a className="desk-back" href="/staff/orders">← All orders</a><DeskMessage title="Request unavailable">{result.failed ? "We could not load this request. Refresh to try again." : "This request is not available. Return to Orders to review current requests."}</DeskMessage>{result.failed && <form method="get"><button className="desk-primary">Try again</button></form>}</>}</DeskShell>;
}
