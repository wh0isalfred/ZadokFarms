import { createHmac } from "node:crypto";
import { orderRequestSchema, receiptSchema, type OrderRequest } from "./contract";
import { whatsappHandoff } from "./whatsapp.server";

type RpcResult = { data: unknown; error: { code?: string } | null };
export type OrderGateway = (input: OrderRequest, fingerprint: string, phoneHash: string) => PromiseLike<RpcResult>;
const messages: Record<string, string> = {
  rate_limited: "Too many requests. Please wait 15 minutes before trying again.",
  catalogue_changed: "Produce, prices or units have changed. Refresh the page and review your basket before submitting again.",
  invalid_quantity: "A quantity does not match the current selling unit. Refresh and review your basket.",
  key_conflict: "This retry does not match the original request. Retry with the original details.",
  invalid_request: "Check your details and basket, then try again.",
};

function respond(body: unknown, status: number, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });
}

// Route handlers give this bounded JSON contract explicit status and retry semantics.
export async function handleOrderRequest(request: Request, gateway: OrderGateway, hashSecret: string, whatsappBusinessNumber?: string) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return respond({ message: "Submit your request from this website." }, 403);
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") return respond({ message: "Send a JSON request." }, 415);
  if (!hashSecret) return respond({ message: "Requests are temporarily unavailable. Your basket is safe." }, 503);

  let raw: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) return respond({ message: "Request details are missing." }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) {
        await reader.cancel();
        return respond({ message: "This request is too large." }, 413);
      }
      chunks.push(value);
    }
    raw = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return respond({ message: "We could not read the request. Please try again." }, 400);
  }
  const parsed = orderRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return respond({ message: "Check your details and basket.", errors: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })) }, 422);
  }
  const input = parsed.data;
  const hash = (value: string) => createHmac("sha256", hashSecret).update(value).digest("hex");
  try {
    const { data, error } = await gateway(input, hash(JSON.stringify({ details: input.details, items: input.items })), hash(`phone:${input.details.phone}`));
    if (error) {
      console.error("Order request RPC failed", { code: error.code });
      return respond({ message: "We could not verify submission. Retry this same request safely." }, 503);
    }
    if (data && typeof data === "object" && "code" in data && typeof data.code === "string") {
      const status = data.code === "rate_limited" ? 429 : data.code === "invalid_request" ? 422 : 409;
      if (messages[data.code]) return respond({ code: data.code, message: messages[data.code] }, status, status === 429 ? { "Retry-After": "900" } : {});
    }
    const receipt = receiptSchema.safeParse(data);
    if (!receipt.success) return respond({ message: "We could not verify submission. Retry this same request safely." }, 503);
    // The RPC binds this exact validated payload to the saved receipt, including on retries.
    // Items/reference come only from its accepted snapshots, never client expected values.
    const recorded = { ...receipt.data, fulfilment: input.details.fulfilment, delivery_address: input.details.delivery_address };
    return respond({ receipt: { ...recorded, whatsappUrl: whatsappHandoff(recorded, whatsappBusinessNumber) } }, 200);
  } catch {
    return respond({ message: "Connection interrupted. Retry this same request safely." }, 503);
  }
}
