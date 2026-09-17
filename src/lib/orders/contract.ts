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
}).strict();

export const orderRequestSchema = z.object({
  key: z.uuid(),
  details: orderDetailsSchema,
  items: z.array(itemSchema).min(1).max(50)
    .refine((items) => new Set(items.map((item) => item.slug)).size === items.length, "Each produce item must appear once.")
    .transform((items) => [...items].sort((a, b) => a.slug.localeCompare(b.slug))),
}).strict();

export const receiptSchema = z.object({
  reference: z.string().regex(/^ZF-[0-9]{8}-[A-Z0-9]{8}$/),
  items: z.array(z.object({ name: z.string(), unit: z.string(), price: z.number(), quantity: z.number() })),
});
export type OrderRequest = z.infer<typeof orderRequestSchema>;
export type OrderReceipt = z.infer<typeof receiptSchema>;
