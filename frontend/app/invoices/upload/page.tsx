import Link from "next/link";
import { redirect } from "next/navigation";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";
import { createClient } from "@/utils/supabase/server";
import { UploaderClient } from "./upload.client";
import styles from "./upload.module.scss";

export default async function Page() {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  if (authError && authError.name !== "AuthSessionMissingError") throw authError;
  if (!data?.claims) redirect("/login?next=/invoices/upload");

  const [vendorResult, propertyResult] = await Promise.all([
    supabase.from("vendors").select("id, name").order("name"),
    supabase.from("properties").select("id, name").order("name"),
  ]);
  if (vendorResult.error) throw vendorResult.error;
  if (propertyResult.error) throw propertyResult.error;

  return (
    <CCard className={styles.uploader}>
      <CCardHeader className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h3 mb-1">New Invoice</h1>
          <p className="mb-0 text-body-secondary">
            Preview an invoice file and enter its details.
          </p>
        </div>
        <Link href="/invoices" className="btn btn-primary">
          View All Invoices
        </Link>
      </CCardHeader>
      <CCardBody>
        <UploaderClient vendors={vendorResult.data} properties={propertyResult.data} />
      </CCardBody>
    </CCard>
  );
}
