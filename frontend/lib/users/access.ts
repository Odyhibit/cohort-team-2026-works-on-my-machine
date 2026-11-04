import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isUserRole } from "./roles";

// React cache deduplicates layout/page checks within one server request.
export const getAccess = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!data?.claims) return { supabase, userId: null, role: null };
  const profile = await supabase.from("profiles").select("role").eq("id", data.claims.sub).maybeSingle();
  if (profile.error) throw profile.error;
  const role = profile.data?.role;
  return { supabase, userId: data.claims.sub, role: typeof role === "string" && isUserRole(role) ? role : null };
});

export async function requireAdmin(path: string) {
  const access = await getAccess();
  if (!access.userId) redirect(`/login?${new URLSearchParams({ next: path })}`);
  if (access.role !== "admin") redirect("/");
  return access;
}
