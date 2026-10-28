"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, undefined);

  return (
    <form action={formAction} className="card card-body d-grid gap-3">
      {state?.error && <p role="alert" className="alert alert-danger mb-0">{state.error}</p>}
      <input type="hidden" name="next" value={next} />
      <label className="form-label">Email
        <input type="email" name="email" required autoComplete="email" defaultValue={state?.email} className="form-control mt-1" />
      </label>
      <label className="form-label">Password
        <input type="password" name="password" required autoComplete="current-password" className="form-control mt-1" />
      </label>
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Signing in…" : "Sign in"}</button>
      <p className="mb-0"><Link href="/reset-password">Forgot your password?</Link></p>
    </form>
  );
}
