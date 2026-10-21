"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

type Property = { id: string; name: string; address: string | null };

const inputClass = "form-control mt-1";
const buttonClass = "btn btn-outline-secondary";
const primaryButtonClass = "btn btn-primary";

export default function PropertiesPage() {
  const [supabase] = useState(createClient);
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
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
    async function loadProperties() {
      setLoadingProperties(true);
      const { data, error: loadError } = await supabase
        .from("properties")
        .select("id, name, address")
        .order("name");
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setProperties(data ?? []);
      setLoadingProperties(false);
    }
    void loadProperties();
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
      setProperties([]);
      cancelEditing();
    }
    setBusy(false);
  }

  function startEditing(property: Property) {
    setEditingId(property.id);
    setName(property.name);
    setAddress(property.address ?? "");
    setError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setAddress("");
  }

  async function saveProperty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a property name.");
      return;
    }
    setBusy(true);
    setError("");
    const values = { name: trimmedName, address: address.trim() || null };
    const query = editingId
      ? supabase.from("properties").update(values).eq("id", editingId)
      : supabase.from("properties").insert(values);
    const { error: saveError } = await query.select("id").single();
    if (saveError) setError(saveError.message);
    else {
      cancelEditing();
      setRefreshCount((count) => count + 1);
    }
    setBusy(false);
  }

  async function deleteProperty(property: Property) {
    if (!window.confirm(`Delete "${property.name}"?`)) return;
    setBusy(true);
    setError("");
    const { error: deleteError } = await supabase
      .from("properties").delete().eq("id", property.id).select("id").single();
    if (deleteError) setError(deleteError.message);
    else {
      if (editingId === property.id) cancelEditing();
      setRefreshCount((count) => count + 1);
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto" style={{ maxWidth: "48rem" }}>
      <header className="mb-4 d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div>
          <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
          <h1>Properties</h1>
        </div>
        {user && <div className="d-flex align-items-center gap-3">
          <span className="text-body-secondary">{user.email}</span>
          <button type="button" onClick={signOut} disabled={busy} className={buttonClass}>Sign out</button>
        </div>}
      </header>

      {error && <p role="alert" className="alert alert-danger">{error}</p>}

      {checkingSession ? <p className="text-body-secondary">Checking your session…</p> : !user ? (
        <form onSubmit={signIn} className="card card-body d-grid gap-3">
          <h2 className="h4">Sign in to manage properties</h2>
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
        </form>
      ) : (
        <div className="d-grid gap-4">
          <form onSubmit={saveProperty} className="card card-body d-grid gap-3">
            <h2 className="h4">{editingId ? "Edit property" : "Add a property"}</h2>
            <label className="form-label">Name
              <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </label>
            <label className="form-label">Address <span className="text-body-secondary">(optional)</span>
              <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} />
            </label>
            <div className="d-flex gap-3">
              <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? "Saving…" : editingId ? "Save changes" : "Add property"}</button>
              {editingId && <button type="button" onClick={cancelEditing} disabled={busy} className={buttonClass}>Cancel</button>}
            </div>
          </form>

          <section aria-labelledby="property-list-title">
            <h2 id="property-list-title" className="h4 mb-3">Saved properties</h2>
            {loadingProperties ? <p className="text-body-secondary">Loading properties…</p> : properties.length === 0 ? (
              <p className="card card-body text-body-secondary">No properties yet. Add one above.</p>
            ) : (
              <ul className="list-group">
                {properties.map((property) => <li key={property.id} className="list-group-item d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div>
                    <p className="fw-medium mb-0">{property.name}</p>
                    {property.address && <p className="small text-body-secondary mb-0">{property.address}</p>}
                  </div>
                  <div className="d-flex gap-2">
                    <button type="button" onClick={() => startEditing(property)} disabled={busy} className={buttonClass}>Edit</button>
                    <button type="button" onClick={() => deleteProperty(property)} disabled={busy} className="btn btn-outline-danger">Delete</button>
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
