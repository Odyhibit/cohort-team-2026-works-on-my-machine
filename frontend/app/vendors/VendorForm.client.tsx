"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveVendor } from "./actions";

export type Vendor = { id: string; name: string; email: string | null; address: string | null };

export default function VendorForm({ vendor }: { vendor?: Vendor }) {
  const [state, formAction, pending] = useActionState(saveVendor, undefined);
  const values = state?.values ?? { name: vendor?.name ?? "", email: vendor?.email ?? "", address: vendor?.address ?? "" };

  return (
    <form action={formAction} className="card card-body d-grid gap-3">
      <h2 className="h4">{vendor ? "Edit vendor" : "Add a vendor"}</h2>
      {state?.error && <p role="alert" className="alert alert-danger mb-0">{state.error}</p>}
      {vendor && <input type="hidden" name="id" value={vendor.id} />}
      <label className="form-label">Name
        <input type="text" name="name" required defaultValue={values.name} className="form-control mt-1" />
      </label>
      <label className="form-label">Email <span className="text-body-secondary">(optional)</span>
        <input type="email" name="email" defaultValue={values.email} className="form-control mt-1" />
      </label>
      <label className="form-label">Address <span className="text-body-secondary">(optional)</span>
        <input type="text" name="address" defaultValue={values.address} className="form-control mt-1" />
      </label>
      <div className="d-flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Saving…" : vendor ? "Save changes" : "Add vendor"}</button>
        {vendor && <Link href="/vendors" className="btn btn-outline-secondary">Cancel</Link>}
      </div>
    </form>
  );
}
