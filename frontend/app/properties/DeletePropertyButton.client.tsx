"use client";

import { useActionState } from "react";
import { deleteProperty } from "./actions";

export default function DeletePropertyButton({ id, name }: { id: string; name: string }) {
  const [state, formAction, pending] = useActionState(deleteProperty, undefined);

  return (
    <form action={formAction} onSubmit={(event) => {
      if (!window.confirm(`Delete "${name}"?`)) event.preventDefault();
    }} className="d-flex align-items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state?.error && <span role="alert" className="small text-danger">{state.error}</span>}
      <button type="submit" disabled={pending} className="btn btn-outline-danger">{pending ? "Deleting…" : "Delete"}</button>
    </form>
  );
}
