"use client";

import { useState, type FormEvent } from "react";
import { deleteVendor, saveVendor } from "./actions";

type Vendor = { id: string; name: string; email: string | null; address: string | null };

export function VendorManager({ vendors, loadError }: { vendors: Vendor[]; loadError: string | null }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setVendorEmail("");
    setAddress("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await saveVendor({ id: editingId, name, email: vendorEmail, address });
      if (result.error) setError(result.error);
      else cancelEditing();
    } catch {
      setError("Could not save the vendor. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(vendor: Vendor) {
    if (!window.confirm(`Delete "${vendor.name}"?`)) return;
    setBusy(true);
    setError("");
    try {
      const result = await deleteVendor(vendor.id);
      if (result.error) setError(result.error);
      else if (editingId === vendor.id) cancelEditing();
    } catch {
      setError("Could not delete the vendor. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d-grid gap-4">
      {(error || loadError) && <p role="alert" className="alert alert-danger mb-0">{error || loadError}</p>}
      <form onSubmit={handleSave} className="card card-body d-grid gap-3">
        <h2 className="h4">{editingId ? "Edit vendor" : "Add a vendor"}</h2>
        <label className="form-label">Name
          <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className="form-control mt-1" />
        </label>
        <label className="form-label">Email <span className="text-body-secondary">(optional)</span>
          <input type="email" value={vendorEmail} onChange={(event) => setVendorEmail(event.target.value)} className="form-control mt-1" />
        </label>
        <label className="form-label">Address <span className="text-body-secondary">(optional)</span>
          <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} className="form-control mt-1" />
        </label>
        <div className="d-flex gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary">{busy ? "Saving…" : editingId ? "Save changes" : "Add vendor"}</button>
          {editingId && <button type="button" onClick={cancelEditing} disabled={busy} className="btn btn-outline-secondary">Cancel</button>}
        </div>
      </form>

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
              <div className="d-flex gap-2">
                <button type="button" onClick={() => {
                  setEditingId(vendor.id);
                  setName(vendor.name);
                  setVendorEmail(vendor.email ?? "");
                  setAddress(vendor.address ?? "");
                  setError("");
                }} disabled={busy} className="btn btn-outline-secondary">Edit</button>
                <button type="button" onClick={() => void handleDelete(vendor)} disabled={busy} className="btn btn-outline-danger">Delete</button>
              </div>
            </li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
