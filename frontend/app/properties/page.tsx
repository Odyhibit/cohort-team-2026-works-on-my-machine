import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ClickableTableRow from "@/components/ClickableTableRow.client";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function PropertiesPage({ searchParams }: Props) {
  return (
    <>
      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 mb-1">Properties</h1>
          <p className="text-body-secondary mb-0">Manage the properties available when entering invoices.</p>
        </div>
        <Link href="/properties/new" className="btn btn-primary">Add property</Link>
      </header>

      <Suspense fallback={<p className="text-body-secondary">Loading properties…</p>}>
        <Properties searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Properties({ searchParams }: Props) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  if (!data?.claims) redirect("/login?next=/properties");

  // Keep existing edit bookmarks working after moving to the resource routes.
  const { edit } = await searchParams;
  if (typeof edit === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(edit)) {
    redirect(`/properties/${edit}/edit`);
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, address")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;

  return (
    <div className="border rounded-3 bg-body overflow-hidden">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr>
              <th scope="col" className="small text-uppercase text-body-secondary ps-3">Property</th>
              <th scope="col" className="small text-uppercase text-body-secondary pe-3">Address</th>
            </tr>
          </thead>
          <tbody>
            {properties.length === 0 && <tr>
              <td colSpan={2} className="p-4 text-body-secondary">No properties yet. Add one to use it on invoices.</td>
            </tr>}
            {properties.map((property) => (
              <ClickableTableRow key={property.id} href={`/properties/${property.id}/edit`}>
                <td className="fw-medium ps-3"><Link href={`/properties/${property.id}/edit`} className="text-body text-decoration-none" aria-label={`Edit ${property.name}`}>{property.name}</Link></td>
                <td className="pe-3">{property.address || "—"}</td>
              </ClickableTableRow>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
