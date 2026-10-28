import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CreateUserForm from "./CreateUserForm.client";

export default async function CreateUserPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/create-user");

  return (
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Create a user</h1>
      <CreateUserForm />
    </div>
  );
}
