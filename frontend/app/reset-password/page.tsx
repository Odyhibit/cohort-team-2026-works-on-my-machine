"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const [supabase] = useState(createClient);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const redirectError = query.get("error_description") ?? fragment.get("error_description");

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasSession(Boolean(session));
      setCheckingSession(false);
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (redirectError) setError(redirectError.replaceAll("+", " "));
      else if (sessionError) setError(sessionError.message);
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (resetError) setError(resetError.message);
    else setEmailSent(true);
    setBusy(false);
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(updateError.message);
    else {
      setPasswordChanged(true);
      setPassword("");
      setConfirmPassword("");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Reset password</h1>

      {error && <p role="alert" className="alert alert-danger">{error}</p>}

      {checkingSession ? (
        <p className="text-body-secondary">Checking your session…</p>
      ) : passwordChanged ? (
        <div role="status" className="card card-body d-grid gap-3">
          <p className="mb-0">Your password has been updated.</p>
          <Link href="/properties">Go to properties</Link>
        </div>
      ) : hasSession ? (
        <form onSubmit={changePassword} className="card card-body d-grid gap-3">
          <p className="mb-0">Enter your new password.</p>
          <label className="form-label">New password
            <input type="password" required minLength={6} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="form-control mt-1" />
          </label>
          <label className="form-label">Confirm new password
            <input type="password" required minLength={6} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="form-control mt-1" />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
      ) : emailSent ? (
        <div role="status" className="card card-body d-grid gap-3">
          <p className="mb-0">If an account exists for {email.trim()}, we sent a password reset link. Check your email.</p>
          <button type="button" className="btn btn-outline-secondary" onClick={() => setEmailSent(false)}>Try another email</button>
        </div>
      ) : (
        <form onSubmit={requestReset} className="card card-body d-grid gap-3">
          <p className="mb-0">Enter your email address and we’ll send you a reset link.</p>
          <label className="form-label">Email
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="form-control mt-1" />
          </label>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <Link href="/login">Back to sign in</Link>
        </form>
      )}
    </div>
  );
}
