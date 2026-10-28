import Link from "next/link";

export default function Home() {
  return (
    <>
      <p>Home Page TBD</p>
      <Link href="/invoices/upload" className="btn btn-primary">
        Upload Invoice
      </Link>
      <Link href="/create-user" className="btn btn-primary">
        Create User
      </Link>
      <Link href="/properties" className="btn btn-primary">
        Manage Properties
      </Link>
      <Link href="/vendors" className="btn btn-primary">
        Manage Vendors
      </Link>
      <Link href="/reset-password" className="btn btn-primary">
        Reset Password
      </Link>
    </>
  );
}
