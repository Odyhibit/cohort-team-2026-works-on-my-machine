"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inputClass = "mt-1 block w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700";

export default function SignUpPage() {
  const [supabase] = useState(createClient);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: trimmedName } },
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session) {
      router.replace("/properties");
    } else {
      setCheckEmail(true);
      setPassword("");
      setConfirmPassword("");
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12 sm:py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">Property management</p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Create an account</h1>

      {error && (
        <p role="alert" className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {checkEmail ? (
        <div role="status" className="space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            If confirmation is required, follow the link sent to {email.trim()}, then sign in.
          </p>
          <Link href="/properties" className="inline-block text-sm font-medium underline">Go to sign in</Link>
        </div>
      ) : (
        <form onSubmit={signUp} className="space-y-4 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <label className="block text-sm font-medium">Name
            <input type="text" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">Password
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm font-medium">Confirm password
            <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200">
            {busy ? "Creating account…" : "Create account"}
          </button>
          <p className="text-sm text-zinc-500">
            Already have an account? <Link href="/properties" className="font-medium text-zinc-900 underline dark:text-white">Sign in</Link>
          </p>
        </form>
      )}
    </main>
  );
}
