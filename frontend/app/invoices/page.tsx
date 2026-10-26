import Link from "next/link";

export default function Invoices() {
  return (
    <>
      <h1 className="h3 mb-3">Invoices</h1>
      <p className="text-body-secondary">Invoice list TBD.</p>
      <Link href="/invoices/upload" className="btn btn-primary">
        New Invoice
      </Link>
    </>
  );
}
