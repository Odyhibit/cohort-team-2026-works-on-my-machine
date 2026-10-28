import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import AppHeaderDropdown from "./AppHeaderDropdown.client";

// Reads the user's claims on the server so only the dropdown ships JavaScript.
export default async function AccountMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return (
      <li className="nav-item">
        <Link className="nav-link" href="/login">Sign in</Link>
      </li>
    );
  }

  return <AppHeaderDropdown email={String(data.claims.email ?? "")} />;
}
