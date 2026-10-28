"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type FormState = { error: string; values?: Record<string, string> } | undefined;

export async function saveVendor(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const submitted = { name, email, address };
  if (!name) return { error: "Enter a vendor name.", values: submitted };

  const values = { name, email: email || null, address: address || null };
  const query = id
    ? supabase.from("vendors").update(values).eq("id", id)
    : supabase.from("vendors").insert(values);
  const { error } = await query.select("id").single();
  if (error) return { error: error.message, values: submitted };

  if (id) redirect("/vendors");
  refresh();
}

export async function deleteVendor(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("vendors").delete().eq("id", id).select("id").single();
  if (error) return { error: error.message };

  redirect("/vendors");
}
