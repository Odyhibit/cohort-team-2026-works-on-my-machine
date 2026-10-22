"use client";

import { useState } from "react";
import { CAlert, CButton, CForm, CFormInput } from "@coreui/react";
import styles from "./upload.module.scss";

type Fields = {
  vendorName: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate: string;
};

export function UploaderClient() {
  const [fields, setFields] = useState<Fields>({
    vendorName: "",
    invoiceNumber: "",
    amountDue: "",
    dueDate: "",
  });
  const [fileName, setFileName] = useState("");
  const [validated, setValidated] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(
    null,
  );

  const setField =
    (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleApprove = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setValidated(true);
    if (e.currentTarget.checkValidity()) {
      setDecision("approved");
    }
  };

  const handleReject = () => {
    setDecision("rejected");
  };

  return (
    <CForm noValidate validated={validated} onSubmit={handleApprove}>
      <section className={styles.dropzone}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.icon}
        >
          <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
          <path d="M14 2v5a1 1 0 0 0 1 1h5" />
          <path d="M12 12v6" />
          <path d="m15 15-3-3-3 3" />
        </svg>
        <h2 className="h5">Upload Invoice PDF</h2>
        <CFormInput
          type="file"
          accept=".pdf"
          required
          id="invoicePdf"
          label="Invoice PDF"
          feedbackInvalid="Please choose a PDF file."
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
        />
        {fileName && <p className="mt-2 mb-0 small">Selected: {fileName}</p>}
      </section>

      <h3 className="h5 mb-3">Invoice Details</h3>

      <CFormInput
        className="mb-3"
        type="text"
        id="vendorName"
        label="Vendor Name"
        placeholder="Enter vendor name"
        required
        value={fields.vendorName}
        onChange={setField("vendorName")}
        feedbackInvalid="Vendor name is required."
      />
      <CFormInput
        className="mb-3"
        type="text"
        id="invoiceNumber"
        label="Invoice Number"
        placeholder="e.g. BILL-1001"
        required
        value={fields.invoiceNumber}
        onChange={setField("invoiceNumber")}
        feedbackInvalid="Invoice number is required."
      />
      <CFormInput
        className="mb-3"
        type="number"
        id="amountDue"
        label="Amount Due"
        step="0.01"
        min="0.01"
        placeholder="0.00"
        required
        value={fields.amountDue}
        onChange={setField("amountDue")}
        feedbackInvalid="Enter an amount greater than 0."
      />
      <CFormInput
        className="mb-4"
        type="date"
        id="dueDate"
        label="Due Date"
        required
        value={fields.dueDate}
        onChange={setField("dueDate")}
        feedbackInvalid="Due date is required."
      />

      <div className={styles.actions}>
        <CButton
          color="secondary"
          variant="outline"
          type="button"
          onClick={handleReject}
        >
          Reject
        </CButton>
        <CButton color="primary" type="submit">
          Approve Invoice
        </CButton>
      </div>

      {decision && (
        <CAlert
          className="mt-4 mb-0"
          color={decision === "approved" ? "success" : "secondary"}
        >
          Invoice {decision} — not yet saved (backend pending).
        </CAlert>
      )}
    </CForm>
  );
}
