"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";

type Property = { id: string; name: string; address: string | null };

const inputClass = "mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";
const buttonClass = "rounded-lg border border-zinc-300 px-3 py-2 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900";
const primaryButtonClass = "rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200";

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
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Property management</p>
          <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
        </div>
        {user && <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">{user.email}</span>
          <button type="button" onClick={signOut} disabled={busy} className={buttonClass}>Sign out</button>
        </div>}
      </header>

      {error && <p role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">{error}</p>}

      {checkingSession ? <p className="text-zinc-500">Checking your session…</p> : !user ? (
        <form onSubmit={signIn} className="space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Sign in to manage properties</h2>
          <label className="block text-sm font-medium">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      ) : (
        <div className="space-y-8">
          <form onSubmit={saveProperty} className="space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h2 className="text-xl font-semibold">{editingId ? "Edit property" : "Add a property"}</h2>
            <label className="block text-sm font-medium">Name
              <input type="text" required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm font-medium">Address <span className="font-normal text-zinc-500">(optional)</span>
              <input type="text" value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} />
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className={primaryButtonClass}>{busy ? "Saving…" : editingId ? "Save changes" : "Add property"}</button>
              {editingId && <button type="button" onClick={cancelEditing} disabled={busy} className={buttonClass}>Cancel</button>}
            </div>
          </form>

          <section aria-labelledby="property-list-title">
            <h2 id="property-list-title" className="mb-4 text-xl font-semibold">Saved properties</h2>
            {loadingProperties ? <p className="text-zinc-500">Loading properties…</p> : properties.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-zinc-500 dark:border-zinc-700">No properties yet. Add one above.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {properties.map((property) => <li key={property.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{property.name}</p>
                    {property.address && <p className="text-sm text-zinc-500">{property.address}</p>}
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button type="button" onClick={() => startEditing(property)} disabled={busy} className={buttonClass}>Edit</button>
                    <button type="button" onClick={() => deleteProperty(property)} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950">Delete</button>
                  </div>
                </li>)}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
