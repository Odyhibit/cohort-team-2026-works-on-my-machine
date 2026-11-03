"use server";

import { revalidatePath } from "next/cache";
import { createClient as createStatelessClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { isUserRole } from "@/lib/users/roles";


export type CreateUserState =
  | { error: string; values: { name: string; email: string; role: string } }
  | { created: { email: string; needsConfirmation: boolean; roleWarning?: string; userId?: string } }
  | undefined;

export async function createUser(_prev: CreateUserState, formData: FormData): Promise<CreateUserState> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const { data: actor, error: actorError } = await supabase.from("profiles")
    .select("role")
    .eq("id", data.claims.sub)
    .single();
  if (actorError || actor?.role !== "admin") return { error: "Only admins can add users.", values: { name: "", email: "", role: "clerk" } };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const role = String(formData.get("role") ?? "");
  const values = { name, email, role };
  if (!isUserRole(role)) return { error: "Choose a valid role.", values };
  if (!name) return { error: "Enter a name.", values };
  if (password !== confirmPassword) return { error: "Passwords do not match.", values };

  const stateless = createStatelessClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
  const { data: signUp, error } = await stateless.auth.signUp({
    email, password, options: { data: { name } },
  });
  if (error) return { error: error.message, values };
  if (!signUp.user || signUp.user.identities?.length === 0) return { error: "This account could not be created. Check whether the email already exists.", values };

  // Signup metadata cannot grant roles. The authenticated admin assigns the
  // selected role through the existing admin-only profile update policy.
  const assigned = await supabase.from("profiles").update({ role })
    .eq("id", signUp.user.id).select("id").single();

  revalidatePath("/users");
  return { created: {
    email, needsConfirmation: !signUp.session, userId: signUp.user.id,
    roleWarning: assigned.error ? "The account was created, but its role could not be assigned. Edit the user to set the role; do not create the account again." : undefined,
  } };
}
