import { deskClient, requireAccess } from "@/lib/staff/pages";
import { readOrders, pageNumber } from "@/lib/staff/orders";
import { DeskShell, OrdersList, DeskMessage } from "@/components/staff/orders";
export default async function Orders({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const page = pageNumber((await searchParams).page);
  const result = await readOrders(await deskClient(), page);
  const staff = requireAccess(result.access, "/staff/orders");
  return <DeskShell staff={staff}><div className="desk-page-heading"><div><p className="desk-eyebrow">ORDERS</p><h1>Submitted requests</h1><p className="desk-lead">The next conversation starts here.</p></div><a className="desk-refresh" href="/staff/orders">Refresh requests <span aria-hidden="true">↻</span></a></div><p className="desk-context">Review what customers have asked for. Availability, fulfilment and payment are confirmed afterward.</p>
    {result.failed ? <DeskMessage title="Requests unavailable">We could not load requests. Refresh to try again.</DeskMessage> : result.orders?.length ? <OrdersList orders={result.orders} /> : <DeskMessage title={page === 1 ? "No requests yet" : "No more requests"}>{page === 1 ? "New customer requests will appear here after they are submitted." : "Return to the previous page or refresh the inbox."}</DeskMessage>}
    <nav className="desk-pagination" aria-label="Request pages">{page > 1 && <a href={`/staff/orders?page=${page - 1}`}>← Newer requests</a>}<span>Page {page}</span>{result.more && <a href={`/staff/orders?page=${page + 1}`}>Older requests →</a>}</nav>
  </DeskShell>;
}
