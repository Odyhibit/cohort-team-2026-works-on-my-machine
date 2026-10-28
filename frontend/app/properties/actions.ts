"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type FormState = { error: string; values?: Record<string, string> } | undefined;

export async function saveProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return { error: "Enter a property name.", values: { name, address } };

  const values = { name, address: address || null };
  const query = id
    ? supabase.from("properties").update(values).eq("id", id)
    : supabase.from("properties").insert(values);
  const { error } = await query.select("id").single();
  if (error) return { error: error.message, values: { name, address } };


  if (id) redirect("/properties");
  refresh();
}

export async function deleteProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  const { error } = await supabase
    .from("properties").delete().eq("id", id).select("id").single();
  if (error) return { error: error.message };

  redirect("/properties");
}
