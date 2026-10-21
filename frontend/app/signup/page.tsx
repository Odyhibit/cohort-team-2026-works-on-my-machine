"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const inputClass = "form-control mt-1";

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
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Create an account</h1>

      {error && (
        <p role="alert" className="alert alert-danger">
          {error}
        </p>
      )}

      {checkEmail ? (
        <div role="status" className="card card-body d-grid gap-3">
          <h2 className="h4">Check your email</h2>
          <p className="text-body-secondary">
            If confirmation is required, follow the link sent to {email.trim()}, then sign in.
          </p>
          <Link href="/properties">Go to sign in</Link>
        </div>
      ) : (
        <form onSubmit={signUp} className="card card-body d-grid gap-3">
          <label className="form-label">Name
            <input type="text" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>
          <label className="form-label">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} />
          </label>
          <label className="form-label">Password
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} />
          </label>
          <label className="form-label">Confirm password
            <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Creating account…" : "Create account"}
          </button>
          <p className="mb-0 text-body-secondary">
            Already have an account? <Link href="/properties">Sign in</Link>
          </p>
        </form>
      )}
    </div>
  );
}
