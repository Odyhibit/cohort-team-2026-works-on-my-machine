"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CAlert, CButton, CForm, CFormInput, CFormSelect } from "@coreui/react";
import { createClient } from "@/utils/supabase/client";
import type { InvoiceDetails } from "@/lib/invoices/invoice-parser";
import styles from "./upload.module.scss";

type Option = { id: string; name: string };
type InvoiceStatus = "created" | "waiting on approval" | "approved" | "paid";

type Fields = {
  vendorId: string;
  propertyId: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate: string;
  paymentUrl: string;
  status: InvoiceStatus;
};

const initialFields: Fields = {
  vendorId: "",
  propertyId: "",
  invoiceNumber: "",
  amountDue: "",
  dueDate: "",
  paymentUrl: "",
  status: "created",
};

function localDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function UploaderClient() {
  const [supabase] = useState(createClient);
  const [vendors, setVendors] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [fields, setFields] = useState<Fields>(initialFields);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [validated, setValidated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ color: "danger" | "info" | "success"; message: string } | null>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error && error.name !== "AuthSessionMissingError") {
        setOptionsError(error.message);
        setLoadingOptions(false);
        return;
      }
      if (!data.user) {
        setNeedsSignIn(true);
        setLoadingOptions(false);
        return;
      }

      try {
        const [vendorResult, propertyResult] = await Promise.all([
          supabase.from("vendors").select("id, name").order("name"),
          supabase.from("properties").select("id, name").order("name"),
        ]);
        if (!active) return;
        if (vendorResult.error || propertyResult.error) {
          setOptionsError(
            vendorResult.error?.message ?? propertyResult.error?.message ?? "Could not load options.",
          );
        } else {
          setVendors(vendorResult.data ?? []);
          setProperties(propertyResult.data ?? []);
        }
      } catch (loadError) {
        if (!active) return;
        setOptionsError(loadError instanceof Error ? loadError.message : "Please try again.");
      }
      setLoadingOptions(false);
    }

    void loadOptions();
    return () => { active = false; };
  }, [supabase]);

  const setField =
    (key: Exclude<keyof Fields, "status">) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }));

  async function extractDetails() {
    if (!selectedFile || extracting) return;
    if (selectedFile.size > 4 * 1024 * 1024) {
      setNotification({ color: "danger", message: "Choose a PDF smaller than 4 MB for extraction." });
      return;
    }
    setExtracting(true);
    setNotification(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await fetch("/invoices/upload/extract", { method: "POST", body: formData });
      const result = await response.json().catch(() => ({})) as { details?: InvoiceDetails; error?: string };
      if (!response.ok || !result.details) {
        throw new Error(result.error ?? "Could not extract invoice details.");
      }

      const details = result.details;
      const normalizedName = details.vendorName?.trim().replace(/\s+/g, " ").toLowerCase();
      const matches = normalizedName
        ? vendors.filter((vendor) => vendor.name.trim().replace(/\s+/g, " ").toLowerCase() === normalizedName)
        : [];
      setFields((prev) => ({
        ...prev,
        vendorId: matches.length === 1 ? matches[0].id : "",
        invoiceNumber: details.invoiceNumber ?? "",
        amountDue: details.amountDue ?? "",
        dueDate: details.dueDate ?? "",
        paymentUrl: details.paymentUrl ?? "",
      }));
      setNotification({
        color: "info",
        message: matches.length === 1
          ? "Details extracted. Review every field and choose a property before saving."
          : `Details extracted. ${details.vendorName ? `No unique vendor match for “${details.vendorName}”.` : "Vendor not found in the PDF."} Choose a vendor and property before saving.`,
      });
    } catch (error) {
      setNotification({
        color: "danger",
        message: error instanceof Error ? error.message : "Could not extract invoice details.",
      });
    } finally {
      setExtracting(false);
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    setValidated(true);
    setNotification(null);
    if (!e.currentTarget.checkValidity() || !fields.vendorId || !fields.propertyId) return;
    if (!fields.invoiceNumber.trim()) {
      setNotification({ color: "danger", message: "Enter an invoice number." });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("invoices").insert({
        date: localDate(),
        reference_number: fields.invoiceNumber.trim(),
        vendor_id: fields.vendorId,
        property_id: fields.propertyId,
        amount: Number(fields.amountDue),
        due_date: fields.dueDate,
        payment_url: fields.paymentUrl.trim() || null,
        status: fields.status,
      });
      if (error) {
        setNotification({ color: "danger", message: `Could not save invoice: ${error.message}` });
      } else {
        setNotification({ color: "success", message: "Invoice saved." });
        setFields(initialFields);
        setValidated(false);
      }
    } catch (error) {
      setNotification({
        color: "danger",
        message: `Could not save invoice: ${error instanceof Error ? error.message : "Please try again."}`,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CForm noValidate validated={validated} onSubmit={handleSave}>
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
        <h2 className="h5">Invoice Preview</h2>
        <CFormInput
          type="file"
          accept=".pdf,image/*"
          id="invoiceFile"
          label="Invoice PDF or image (optional)"
          disabled={extracting}
          onChange={(e) => {
            const file = e.target.files?.[0];
            setSelectedFile(file ?? null);
            setPreviewType(file?.type ?? "");
            setPreviewUrl(file ? URL.createObjectURL(file) : "");
            setNotification(null);
          }}
        />
        {selectedFile && <p className="mt-2 mb-0 small">Selected: {selectedFile.name}</p>}
        {previewUrl && (
          <object className={styles.preview} data={previewUrl} type={previewType} aria-label="Selected invoice preview">
            <a href={previewUrl} target="_blank" rel="noreferrer">Open invoice preview</a>
          </object>
        )}
        {selectedFile && (selectedFile.type === "application/pdf" || /\.pdf$/i.test(selectedFile.name)) && (
          <CButton
            className="mt-3"
            color="secondary"
            type="button"
            disabled={extracting || loadingOptions || needsSignIn || !!optionsError}
            onClick={() => void extractDetails()}
          >
            {extracting ? "Extracting…" : "Extract details from PDF"}
          </CButton>
        )}
        <p className="mt-2 mb-0 small text-body-secondary">Preview only. The file is not saved with the invoice.</p>
      </section>

      <h3 className="h5 mb-3">Invoice Details</h3>

      {needsSignIn && (
        <CAlert color="warning">
          <Link href="/login?next=/invoices/upload">Sign in</Link> to choose a vendor and property.
        </CAlert>
      )}
      {optionsError && <CAlert color="danger" role="alert">Could not load vendors and properties: {optionsError}</CAlert>}
      {!loadingOptions && !needsSignIn && !optionsError && (vendors.length === 0 || properties.length === 0) && (
        <CAlert color="warning">
          {vendors.length === 0 && properties.length === 0
            ? "Add a vendor and a property before saving an invoice."
            : vendors.length === 0
              ? "Add a vendor before saving an invoice."
              : "Add a property before saving an invoice."}
        </CAlert>
      )}

      <CFormSelect
        className="mb-3"
        id="vendorId"
        name="vendor_id"
        label="Vendor"
        required
        disabled={loadingOptions || needsSignIn || !!optionsError || vendors.length === 0}
        value={fields.vendorId}
        onChange={setField("vendorId")}
        feedbackInvalid="Choose a vendor."
      >
        <option value="" disabled>{loadingOptions ? "Loading vendors…" : "Choose a vendor"}</option>
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
        ))}
      </CFormSelect>
      <CFormSelect
        className="mb-3"
        id="propertyId"
        name="property_id"
        label="Property"
        required
        disabled={loadingOptions || needsSignIn || !!optionsError || properties.length === 0}
        value={fields.propertyId}
        onChange={setField("propertyId")}
        feedbackInvalid="Choose a property."
      >
        <option value="" disabled>{loadingOptions ? "Loading properties…" : "Choose a property"}</option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>{property.name}</option>
        ))}
      </CFormSelect>
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
      <CFormInput
        className="mb-4"
        type="url"
        id="paymentUrl"
        name="payment_url"
        label="Payment URL"
        placeholder="https://example.com/invoice"
        value={fields.paymentUrl}
        onChange={setField("paymentUrl")}
        feedbackInvalid="Enter a valid URL."
      />
      <CFormSelect
        className="mb-4"
        id="status"
        name="status"
        label="Status"
        value={fields.status}
        onChange={(e) => setFields((prev) => ({ ...prev, status: e.target.value as InvoiceStatus }))}
      >
        <option value="created">Created</option>
        <option value="waiting on approval">Waiting on approval</option>
        <option value="approved">Approved</option>
        <option value="paid">Paid</option>
      </CFormSelect>

      <div className={styles.actions}>
        <CButton color="primary" type="submit" disabled={saving || extracting || loadingOptions || needsSignIn || !!optionsError || vendors.length === 0 || properties.length === 0}>
          {saving ? "Saving…" : "Save Invoice"}
        </CButton>
      </div>

      {notification && (
        <CAlert
          className="mt-4 mb-0"
          color={notification.color}
          role={notification.color === "danger" ? "alert" : "status"}
          aria-live={notification.color === "danger" ? "assertive" : "polite"}
          dismissible
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </CAlert>
      )}
    </CForm>
  );
}
