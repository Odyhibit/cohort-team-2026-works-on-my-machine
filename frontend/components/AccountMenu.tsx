import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AccountMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return null;

  return (
    <div className="d-flex align-items-center gap-3">
      <span className="text-body-secondary">{data.claims.email}</span>
      <Link href="/reset-password">Change password</Link>
      <form action={signOut}>
        <button type="submit" className="btn btn-outline-secondary">Sign out</button>
      </form>
    </div>
  );
}
