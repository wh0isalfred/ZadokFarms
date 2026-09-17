import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { handleOrderRequest } from "@/lib/orders/boundary";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  const hashSecret = process.env.ORDER_REQUEST_HASH_SECRET;
  if (!url || !secret || !hashSecret) {
    return Response.json({ message: "Requests are temporarily unavailable. Your basket is safe." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  // This client never reads browser cookies or receives customer auth tokens.
  const client = createClient<Database>(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return handleOrderRequest(request, (input, fingerprint, phoneHash) => client.rpc("submit_order_request", {
    p_key: input.key,
    p_payload: { details: input.details, items: input.items },
    p_fingerprint: fingerprint,
    p_phone_hash: phoneHash,
  }), hashSecret);
}
