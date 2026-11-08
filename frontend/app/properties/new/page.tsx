import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PropertyForm from "../PropertyForm.client";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto" style={{ maxWidth: "40rem" }}>
      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Add property</h1>
          <p className="text-body-secondary mb-0">Enter the property details for future invoices.</p>
        </div>
        <Link href="/properties" className="btn btn-outline-secondary">Back to properties</Link>
      </header>
      <Suspense fallback={<p className="text-body-secondary">Loading form…</p>}>
        <NewPropertyForm />
      </Suspense>
    </div>
  );
}

async function NewPropertyForm() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!data?.claims) redirect("/login?next=/properties/new");
  return <PropertyForm />;
}
