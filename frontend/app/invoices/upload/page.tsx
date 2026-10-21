import Link from "next/link";
import { CCard, CCardBody, CCardHeader } from "@coreui/react";
import { UploaderClient } from "./upload.client";
import styles from "./upload.module.scss";

export default function Page() {
  return (
    <CCard className={styles.uploader}>
      <CCardHeader className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <h1 className="h3 mb-1">Invoice Review</h1>
          <p className="mb-0 text-body-secondary">
            Upload an invoice and review its details.
          </p>
        </div>
        <Link href="/invoices" className="btn btn-primary">
          View All Invoices
        </Link>
      </CCardHeader>
      <CCardBody>
        <UploaderClient />
      </CCardBody>
    </CCard>
  );
}
