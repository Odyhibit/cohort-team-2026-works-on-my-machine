"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { archiveProperty, saveProperty, type SavedProperty } from "./actions";
import ArchiveButton from "@/components/ArchiveButton.client";

export type Property = { id: string; name: string; address: string | null };
export default function PropertyForm({ property, defaultName, onSaved, onCancel, canViewHistory = false }: {
  property?: Property;
  defaultName?: string;
  onSaved?: (property: SavedProperty) => void;
  onCancel?: () => void;
  canViewHistory?: boolean;
}) {
  const formId = useId();
  const router = useRouter();
  const [formVersion, setFormVersion] = useState(0);
  const embedded = !!onSaved;
  const [state, formAction, pending] = useActionState(async (prev: Parameters<typeof saveProperty>[0], formData: FormData) => {
    const result = await saveProperty(prev, formData);
    if (result?.saved) {
      // Clear a successful new-property draft before Next retains this page.
      if (!property) setFormVersion((version) => version + 1);
      if (onSaved) onSaved(result.saved);
      else router.push("/properties");
    }
    return result;
  }, undefined);
  const values = state?.values ?? { name: property?.name ?? defaultName ?? "", address: property?.address ?? "" };

  return (
    <div className={embedded ? "d-grid gap-3" : "card card-body d-grid gap-3"}>
    <form key={formVersion} id={formId} action={formAction} className="d-grid gap-3" autoComplete="off">
      {!embedded && <h2 className="h5 mb-0">Property details</h2>}
      {state?.error && <p role="alert" className="alert alert-danger mb-0">{state.error}</p>}
      {property && <input type="hidden" name="id" value={property.id} />}
      <label className="form-label">Name
        <input type="text" name="name" required defaultValue={values.name} className="form-control mt-1" />
      </label>
      <label className="form-label">Address <span className="text-body-secondary">(optional)</span>
        <input type="text" name="address" defaultValue={values.address} className="form-control mt-1" />
      </label>
    </form>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex gap-2">
        <button type="submit" form={formId} disabled={pending} className="btn btn-sm btn-primary">{pending ? "Saving…" : property ? "Save changes" : "Add property"}</button>
        {embedded
          ? <button type="button" onClick={onCancel} className="btn btn-sm btn-outline-secondary">Cancel</button>
          : <Link href="/properties" className="btn btn-sm btn-outline-secondary">Cancel</Link>}
        {property && canViewHistory && <Link href={`/events?type=property&id=${property.id}`} className="btn btn-sm btn-outline-secondary">History</Link>}
        </div>
        {property && <ArchiveButton action={archiveProperty} id={property.id} name={property.name} size="sm" />}
      </div>
    </div>
  );
}
