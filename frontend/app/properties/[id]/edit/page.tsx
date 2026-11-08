import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getAccess } from "@/lib/users/access";
import PropertyForm from "../../PropertyForm.client";

type Props = { params: Promise<{ id: string }> };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditPropertyPage({ params }: Props) {
  return (
    <div className="mx-auto" style={{ maxWidth: "40rem" }}>
      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Edit property</h1>
          <p className="text-body-secondary mb-0">Update the property details.</p>
        </div>
        <Link href="/properties" className="btn btn-outline-secondary">Back to properties</Link>
      </header>
      <Suspense fallback={<p className="text-body-secondary">Loading property…</p>}>
        <PropertyEditor params={params} />
      </Suspense>
    </div>
  );
}

async function PropertyEditor({ params }: Props) {
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  if (!data?.claims) redirect(`/login?next=/properties/${id}/edit`);

  const { data: property, error } = await supabase.from("properties")
    .select("id, name, address")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!property) notFound();

  const { role } = await getAccess();
  return <PropertyForm key={JSON.stringify(property)} property={property} canViewHistory={role === "admin"} />;
}
