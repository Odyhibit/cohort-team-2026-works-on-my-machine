import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginForm from "./LoginForm.client";
import { redirectTarget } from "./redirect-target";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const next = redirectTarget((await searchParams).next);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Sign in</h1>
      <LoginForm next={next} />
    </div>
  );
}
