"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { redirectTarget } from "./redirect-target";

export type LoginState = { error: string; email: string } | undefined;

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message, email };

  redirect(redirectTarget(formData.get("next")));
}
