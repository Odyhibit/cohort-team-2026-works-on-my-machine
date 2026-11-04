"use client";

import { useActionState } from "react";

type ArchiveAction = (prev: { error: string } | undefined, formData: FormData) => Promise<{ error: string } | undefined>;

export default function ArchiveButton({ action, id, name, size }: { action: ArchiveAction; id: string; name: string; size?: "sm" }) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} onSubmit={(event) => {
      if (!window.confirm(`Archive "${name}"? It will be hidden from active lists.`)) event.preventDefault();
    }} className="d-flex align-items-center gap-2">
      <input type="hidden" name="id" value={id} />
      {state?.error && <span role="alert" className="small text-danger">{state.error}</span>}
      <button type="submit" disabled={pending} className={`btn ${size ? "btn-sm " : ""}btn-outline-danger`}>{pending ? "Archiving…" : "Archive"}</button>
    </form>
  );
}
