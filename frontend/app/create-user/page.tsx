import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CreateUserForm from "./CreateUserForm.client";

export default function CreateUserPage() {
  return (
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Create a user</h1>
      <Suspense fallback={<p className="text-body-secondary">Loading…</p>}>
        <CreateUser />
      </Suspense>
    </div>
  );
}

async function CreateUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login?next=/create-user");

  return <CreateUserForm />;
}
