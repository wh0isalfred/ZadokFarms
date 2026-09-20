import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type StaffClient = SupabaseClient<Database>;
export type Staff = { id: string; full_name: string };
export type Access = { kind: "active"; staff: Staff } | { kind: "unauthenticated" | "denied" | "unavailable" };

export async function staffAccess(client: StaffClient): Promise<Access> {
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { kind: "unauthenticated" };
    const profile = await client.from("staff_profiles").select("id,full_name,active")
      .eq("id", data.user.id).eq("active", true).maybeSingle();
    if (profile.error) return { kind: "unavailable" };
    if (!profile.data?.active || profile.data.id !== data.user.id) return { kind: "denied" };
    return { kind: "active", staff: { id: profile.data.id, full_name: profile.data.full_name } };
  } catch { return { kind: "unavailable" }; }
}
