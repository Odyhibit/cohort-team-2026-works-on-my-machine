"use client";

import { useEffect } from "react";
import Link from "next/link";
import StatusPage from "@/components/StatusPage";

type ErrorStatusProps = {
  title: string;
  error: unknown;
  retry: () => void;
};

export default function ErrorStatus({ title, error, retry }: ErrorStatusProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : undefined;

  return (
    <StatusPage
      eyebrow="Something went wrong"
      title={title}
      description="This is usually temporary. Try again, and if it keeps happening, contact your administrator."
      footnote={digest ? `Reference: ${digest}` : undefined}
    >
      <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
      <Link href="/" className="btn btn-outline-secondary">Go to dashboard</Link>
    </StatusPage>
  );
}
