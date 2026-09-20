import { staffAccess, type StaffClient } from "./access";

export const LIST_FIELDS = "id,reference,requested_at,status,fulfilment_method,customers(full_name),order_items(quantity,unit_price_ngn)";
export const DETAIL_FIELDS = "id,reference,requested_at,status,fulfilment_method,delivery_address,customer_note,customers(full_name,phone),order_items(id,product_name,selling_unit,quantity,unit_price_ngn),order_status_events(to_status,created_at)";
export const PAGE_SIZE = 25;
export function pageNumber(value: unknown) {
  return typeof value === "string" && /^[1-9][0-9]{0,4}$/.test(value) ? Number(value) : 1;
}

// Authorization lives beside every read, not solely in a shared layout/proxy.
export async function readOrders(client: StaffClient, page: number) {
  const access = await staffAccess(client);
  if (access.kind !== "active") return { access, orders: null, failed: false, more: false };
  try {
    const result = await client.from("order_requests").select(LIST_FIELDS)
      .order("requested_at", { ascending: false }).order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    return { access, orders: result.error ? null : result.data?.slice(0, PAGE_SIZE) ?? [], failed: !!result.error, more: (result.data?.length ?? 0) > PAGE_SIZE };
  } catch { return { access, orders: null, failed: true, more: false }; }
}

export async function readOrder(client: StaffClient, id: string) {
  const access = await staffAccess(client);
  if (access.kind !== "active") return { access, order: null, failed: false };
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) return { access, order: null, failed: false };
  try {
    const result = await client.from("order_requests").select(DETAIL_FIELDS).eq("id", id).maybeSingle();
    return { access, order: result.error ? null : result.data, failed: !!result.error };
  } catch { return { access, order: null, failed: true }; }
}

export type OrderList = NonNullable<Awaited<ReturnType<typeof readOrders>>["orders"]>;
export type OrderDetail = NonNullable<Awaited<ReturnType<typeof readOrder>>["order"]>;
