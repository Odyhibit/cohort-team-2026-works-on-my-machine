import type { Metadata } from "next";
import Link from "next/link";
import StatusPage from "@/components/StatusPage";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Error 404"
      title="Page not found"
      description="The page may have moved, or the link may be out of date. If you followed a link to an invoice, vendor or user, that record may no longer exist."
    >
      <Link href="/" className="btn btn-primary">Go to dashboard</Link>
      <Link href="/invoices" className="btn btn-outline-secondary">View invoices</Link>
    </StatusPage>
  );
}
