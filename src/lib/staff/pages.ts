import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Access } from "./access";
import { safeReturnPath } from "./security";
export async function deskClient() {
  try { return await createClient(); } catch { redirect("/staff/access-unavailable"); }
}
export function requireAccess(access: Access, path: string) {
  if (access.kind === "unauthenticated") redirect(`/staff/sign-in?next=${encodeURIComponent(safeReturnPath(path))}`);
  if (access.kind !== "active") redirect("/staff/access-unavailable");
  return access.staff;
}
