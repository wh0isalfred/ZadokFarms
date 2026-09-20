import type { RecordedReceipt } from "./contract";

/** Called only by the server mutation boundary after the RPC has accepted the request. */
export function whatsappHandoff(receipt: RecordedReceipt, configuredNumber?: string): string | null {
  const configured = configuredNumber?.trim();
  if (!configured || !/^\+?[0-9 ()-]+$/.test(configured)) return null;
  const number = configured.replace(/[ ()+-]/g, "");
  if (!/^[1-9][0-9]{6,14}$/.test(number) || !receipt.fulfilment) return null;
  const fulfilment = { pickup: "Pickup", delivery: "Delivery", to_confirm: "I need guidance" }[receipt.fulfilment];
  const line = (value: string) => value.replace(/\s+/g, " ").trim();
  const message = [
    `Hello Zadok Farm, I recorded request ${receipt.reference}.`,
    "Requested produce:",
    ...receipt.items.map((item) => `- ${item.quantity} x ${line(item.name)} (${line(item.unit)})`),
    `Fulfilment preference: ${fulfilment}.`,
    ...(receipt.fulfilment === "delivery" && receipt.delivery_address ? [`Delivery address: ${line(receipt.delivery_address)}`] : []),
    "Please review availability and fulfilment with me. Thank you.",
  ].join("\n");
  const url = new URL(`https://wa.me/${number}`);
  url.searchParams.set("text", message);
  return url.href;
}
