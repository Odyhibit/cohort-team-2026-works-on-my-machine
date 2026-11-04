"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createUser, type CreateUserState } from "./actions";
import UserRoleSelect from "../UserRoleSelect";

export default function CreateUserForm() {
  const [formVersion, setFormVersion] = useState(0);
  const [state, formAction, pending] = useActionState(async (previous: CreateUserState, formData: FormData) => {
    const result = await createUser(previous, formData);
    if (result && "created" in result) setFormVersion((version) => version + 1);
    return result;
  }, undefined);
  const values = state && "values" in state ? state.values : undefined;

  return (
    <form key={formVersion} action={formAction} className="card card-body d-grid gap-3">
      <h2 className="h5 mb-0">User details</h2>
      {state && "error" in state && <p role="alert" className="alert alert-danger mb-0">{state.error}</p>}
      {state && "created" in state && <p role="status" className="alert alert-success mb-0">
        Created {state.created.email}.
        {state.created.needsConfirmation && " They need to follow the confirmation link sent to that address before signing in."}
      </p>}
      {state && "created" in state && state.created.roleWarning && <p role="alert" className="alert alert-warning mb-0">
        {state.created.roleWarning} {state.created.userId && <Link href={`/users/${state.created.userId}/edit`}>Edit user</Link>}
      </p>}
      <label className="form-label">Name
        <input type="text" name="name" required autoComplete="off" defaultValue={values?.name ?? ""} className="form-control mt-1" />
      </label>
      <label className="form-label">Email
        <input type="email" name="email" required autoComplete="off" defaultValue={values?.email ?? ""} className="form-control mt-1" />
      </label>
      <UserRoleSelect value={values?.role ?? "clerk"} />
      <label className="form-label">Password
        <input type="password" name="password" required minLength={6} autoComplete="new-password" className="form-control mt-1" />
      </label>
      <label className="form-label">Confirm password
        <input type="password" name="confirmPassword" required minLength={6} autoComplete="new-password" className="form-control mt-1" />
      </label>
      <div className="d-flex gap-2">
        <button type="submit" disabled={pending} className="btn btn-sm btn-primary">{pending ? "Creating user…" : "Add user"}</button>
        <Link href="/users" className="btn btn-sm btn-outline-secondary">Cancel</Link>
      </div>
    </form>
  );
}
