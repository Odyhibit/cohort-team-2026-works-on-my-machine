"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Vendor = { id: string; name: string; email: string | null; address: string | null };

const inputClass = "form-control mt-1";
const buttonClass = "btn btn-outline-secondary";
const primaryButtonClass = "btn btn-primary";

export default function VendorsPage() {
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data, error: authError }) => {
      if (!active) return;
      setUser(data.user);
      if (authError && authError.name !== "AuthSessionMissingError") {
        setError(authError.message);
      }
      setCheckingSession(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setCheckingSession(false);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadVendors() {
      setLoadingVendors(true);
      const { data, error: loadError } = await supabase
        .from("vendors")
        .select("id, name, email, address")
        .order("name");
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setVendors(data ?? []);
      setLoadingVendors(false);
    }
    void loadVendors();
    return () => { active = false; };
  }, [supabase, userId, refreshCount]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    if (signInError) setError(signInError.message);
    else {
      setUser(data.user);
      setPassword("");
    }
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else {
      setUser(null);
      setVendors([]);
      cancelEditing();
    }
    setBusy(false);
  }

  function startEditing(vendor: Vendor) {
    setEditingId(vendor.id);
    setName(vendor.name);
    setVendorEmail(vendor.email ?? "");
    setAddress(vendor.address ?? "");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setVendorEmail("");
    setAddress("");
  }

  async function saveVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a vendor name.");
      return;
    }
    setBusy(true);
    setError("");
    const values = {
      name: trimmedName,
      email: vendorEmail.trim() || null,
      address: address.trim() || null,
    };
    const query = editingId
      ? supabase.from("vendors").update(values).eq("id", editingId)
      : supabase.from("vendors").insert(values);
    const { error: saveError } = await query.select("id").single();
    if (saveError) setError(saveError.message);
    else {
      cancelEditing();
      setRefreshCount((count) => count + 1);
    }
    setBusy(false);
  }

  async function deleteVendor(vendor: Vendor) {
    if (!window.confirm(`Delete "${vendor.name}"?`)) return;
    setBusy(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("vendors").delete().eq("id", vendor.id).select("id").single();
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === vendor.id) cancelEditing();
      setRefreshCount((count) => count + 1);
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto" style={{ maxWidth: "48rem" }}>
      <header className="mb-4 d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Vendor management</p>
          <h1>Vendors</h1>
        </div>
        {user && <div className="d-flex align-items-center gap-3">
          <span className="text-body-secondary">{user.email}</span>
          <Link href="/reset-password">Change password</Link>
          <button type="button" onClick={signOut} disabled={busy} className={buttonClass}>Sign out</button>
        </div>}
      </header>

      {error && <p role="alert" className="alert alert-danger">{error}</p>}

      {checkingSession ? <p className="text-body-secondary">Checking your session…</p> : !user ? (
        <form onSubmit={signIn} className="card card-body d-grid gap-3">
          <h2 className="h4">Sign in to manage vendors</h2>
          <label className="form-label">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="form-label">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? "Signing in…" : "Sign in"}</button>
          <p className="mb-0 text-body-secondary">
            New here? <Link href="/signup">Create an account</Link>
          </p>
          <p className="mb-0"><Link href="/reset-password">Forgot your password?</Link></p>
        </form>
      ) : (
        <div className="d-grid gap-4">
          <form onSubmit={saveVendor} className="card card-body d-grid gap-3">
            <h2 className="h4">{editingId ? "Edit vendor" : "Add a vendor"}</h2>
            <label className="form-label">Name
              <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </label>
            <label className="form-label">Email <span className="text-body-secondary">(optional)</span>
              <input type="email" value={vendorEmail} onChange={(event) => setVendorEmail(event.target.value)} className={inputClass} />
            </label>
            <label className="form-label">Address <span className="text-body-secondary">(optional)</span>
              <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} />
            </label>
            <div className="d-flex gap-3">
              <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? "Saving…" : editingId ? "Save changes" : "Add vendor"}</button>
              {editingId && <button type="button" onClick={cancelEditing} disabled={busy} className={buttonClass}>Cancel</button>}
            </div>
          </form>

          <section aria-labelledby="vendor-list-title">
            <h2 id="vendor-list-title" className="h4 mb-3">Saved vendors</h2>
            {loadingVendors ? <p className="text-body-secondary">Loading vendors…</p> : vendors.length === 0 ? (
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
                    <button type="button" onClick={() => startEditing(vendor)} disabled={busy} className={buttonClass}>Edit</button>
                    <button type="button" onClick={() => deleteVendor(vendor)} disabled={busy} className="btn btn-outline-danger">Delete</button>
                  </div>
                </li>)}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
