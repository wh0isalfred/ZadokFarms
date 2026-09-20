import { z } from "zod";

const itemSchema = z.object({
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  quantity: z.number().int().min(1).max(9999),
  expectedPrice: z.number().int().min(0).max(2147483647),
  expectedName: z.string().min(2).max(120),
  expectedUnit: z.string().min(1).max(50),
}).strict();

export const orderDetailsSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(120),
  phone: z.string().trim().max(30).transform((value) => value.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+[1-9][0-9]{6,14}$/, "Use the country code, for example +2348012345678.")),
  fulfilment: z.enum(["pickup", "delivery", "to_confirm"]),
  delivery_address: z.string().trim().max(500, "Keep the delivery address within 500 characters.").default(""),
  note: z.string().trim().max(500, "Keep your note within 500 characters.").default(""),
}).strict().superRefine((details, context) => {
  if (details.fulfilment === "delivery" && !details.delivery_address) {
    context.addIssue({ code: "custom", path: ["delivery_address"], message: "Enter your delivery address." });
  }
}).transform((details) => ({ ...details, delivery_address: details.fulfilment === "delivery" ? details.delivery_address : "" }));

export const orderRequestSchema = z.object({
  key: z.uuid(),
  details: orderDetailsSchema,
  items: z.array(itemSchema).min(1).max(50)
    .refine((items) => new Set(items.map((item) => item.slug)).size === items.length, "Each produce item must appear once.")
    .transform((items) => [...items].sort((a, b) => a.slug.localeCompare(b.slug))),
}).strict();

export const receiptSchema = z.object({
  reference: z.string().regex(/^ZF-[0-9]{8}-[2-9A-HJKMNP-Z]{6}$/),
  items: z.array(z.object({ name: z.string(), unit: z.string(), price: z.number(), quantity: z.number() })),
});
export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderReceipt = z.infer<typeof receiptSchema>;

// Backwards compatible with receipts saved before the handoff milestone.
// A damaged optional link must never hide an otherwise valid recorded reference.
export const recordedReceiptSchema = receiptSchema.extend({
  fulfilment: z.enum(["pickup", "delivery", "to_confirm"]).optional().catch(undefined),
  delivery_address: z.string().max(500).optional().catch(undefined),
  whatsappUrl: z.string().max(30000).refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "wa.me" && !url.port &&
        !url.username && !url.password && !url.hash && /^\/[1-9][0-9]{6,14}$/.test(url.pathname) &&
        url.searchParams.has("text") && [...url.searchParams.keys()].every((key) => key === "text");
    } catch { return false; }
  }).nullish().catch(null),
});
export type RecordedReceipt = z.infer<typeof recordedReceiptSchema>;
export const REQUEST_STORAGE_KEY = "zadok-request-attempt-v1";
