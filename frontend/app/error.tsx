"use client";

import ErrorStatus from "@/components/ErrorStatus.client";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorStatus title="We couldn't load this page" error={error} retry={retry} />;
}
