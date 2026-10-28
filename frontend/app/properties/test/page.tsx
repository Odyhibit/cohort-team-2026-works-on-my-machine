// Reference pattern: fetch in a Server Component with the server Supabase client,
// then pass the data to a small client component only for interactivity.
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import PropertySelect from "./PropertySelect.client";

export default async function PropertiesTestPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return <p><Link href="/login?next=/properties/test">Sign in to view properties</Link></p>;
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name")
    .order("name");
  if (error) throw error;

  return <PropertySelect properties={properties ?? []} />;
}
