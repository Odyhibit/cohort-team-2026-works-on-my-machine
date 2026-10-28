import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AccountMenu from "@/components/AccountMenu";
import DeleteButton from "@/components/DeleteButton.client";
import { deleteVendor } from "./actions";
import VendorForm from "./VendorForm.client";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function VendorsPage({ searchParams }: Props) {
  return (
    <div className="mx-auto" style={{ maxWidth: "48rem" }}>
      <header className="mb-4 d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Vendor management</p>
          <h1>Vendors</h1>
        </div>
        <Suspense>
          <AccountMenu />
        </Suspense>
      </header>

      <Suspense fallback={<p className="text-body-secondary">Loading vendors…</p>}>
        <Vendors searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Vendors({ searchParams }: Props) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  if (!data?.claims) redirect("/login?next=/vendors");

  const { data: vendors, error } = await supabase
    .from("vendors")
    .select("id, name, email, address")
    .order("name");
  if (error) throw error;

  const { edit } = await searchParams;
  const editing = vendors.find((vendor) => vendor.id === edit);

  return (
    <div className="d-grid gap-4">
      <VendorForm key={editing?.id ?? "new"} vendor={editing} />

      <section aria-labelledby="vendor-list-title">
        <h2 id="vendor-list-title" className="h4 mb-3">Saved vendors</h2>
        {vendors.length === 0 ? (
          <p className="card card-body text-body-secondary">No vendors yet. Add one above.</p>
        ) : (
          <ul className="list-group">
            {vendors.map((vendor) => <li key={vendor.id} className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <p className="fw-medium mb-0">{vendor.name}</p>
                {vendor.email && <p className="small text-body-secondary mb-0">{vendor.email}</p>}
                {vendor.address && <p className="small text-body-secondary mb-0">{vendor.address}</p>}
              </div>
              <div className="d-flex align-items-center gap-2">
                <Link href={{ pathname: "/vendors", query: { edit: vendor.id } }} className="btn btn-outline-secondary">Edit</Link>
                <DeleteButton action={deleteVendor} id={vendor.id} name={vendor.name} />
              </div>
            </li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
