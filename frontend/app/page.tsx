import Link from "next/link";

export default function Home() {
  return (
    <>
      <p>Home Page TBD</p>
      <Link href="/invoices/upload" className="btn btn-primary">
        Upload Invoice
      </Link>
    </>
  );
}
