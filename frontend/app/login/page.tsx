import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import LoginForm from "./LoginForm.client";
import { redirectTarget } from "./redirect-target";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function LoginPage({ searchParams }: Props) {
  return (
    <div className="mx-auto" style={{ maxWidth: "28rem" }}>
      <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">Property management</p>
      <h1 className="mb-4">Sign in</h1>
      <Suspense fallback={<p className="text-body-secondary">Loading…</p>}>
        <Login searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Login({ searchParams }: Props) {
  const next = redirectTarget((await searchParams).next);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return <LoginForm next={next} />;
}
