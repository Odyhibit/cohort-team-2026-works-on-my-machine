import type { InvoiceDetails } from "./invoice-parser";

export const emptyInvoiceDetails: InvoiceDetails = {
  vendorName: null, propertyName: null, invoiceNumber: null,
  amountDue: null, dueDate: null, paymentUrl: null,
};

// Both parser output and model output cross this boundary before reaching a form.
export function validatedExtraction(value: unknown): InvoiceDetails {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const text = (key: keyof InvoiceDetails, limit: number) => {
    const raw = input[key];
    return typeof raw === "string" && raw.trim().length > 0 && raw.trim().length <= limit ? raw.trim() : null;
  };
  const details: InvoiceDetails = {
    vendorName: text("vendorName", 200), propertyName: text("propertyName", 200),
    invoiceNumber: text("invoiceNumber", 200), amountDue: text("amountDue", 20),
    dueDate: text("dueDate", 10), paymentUrl: text("paymentUrl", 2048),
  };
  if (!details.amountDue || !/^\d+(?:\.\d{1,2})?$/.test(details.amountDue)
    || !Number.isFinite(Number(details.amountDue)) || Number(details.amountDue) <= 0) details.amountDue = null;
  if (details.dueDate) {
    const date = new Date(`${details.dueDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.dueDate) || !Number.isFinite(date.getTime())
      || date.toISOString().slice(0, 10) !== details.dueDate) details.dueDate = null;
  }
  if (details.paymentUrl) {
    try {
      const url = new URL(details.paymentUrl);
      if (url.protocol !== "https:" || url.username || url.password) details.paymentUrl = null;
    } catch { details.paymentUrl = null; }
  }
  return details;
}

export function extractionComplete(details: InvoiceDetails) {
  return Boolean(details.vendorName && details.propertyName && details.invoiceNumber
    && details.amountDue && details.dueDate);
}

export type ExtractionResult = {
  details: InvoiceDetails;
  requiresReview: boolean;
  warning?: string;
};

// Dependencies make fallback/error behavior testable without a paid API call.
export async function extractWithFallback(
  bytes: Uint8Array,
  mime: string,
  dependencies: {
    parsePdf: (bytes: Uint8Array) => Promise<InvoiceDetails>;
    readDocument?: (bytes: Uint8Array, mime: string) => Promise<InvoiceDetails>;
  },
): Promise<ExtractionResult> {
  let details = { ...emptyInvoiceDetails };
  if (mime === "application/pdf") {
    try { details = validatedExtraction(await dependencies.parsePdf(bytes)); }
    catch { /* Image-only/unsupported text PDFs can still be read visually. */ }
    if (extractionComplete(details)) return { details, requiresReview: false };
  }
  if (!dependencies.readDocument) {
    return { details, requiresReview: true, warning: "AI extraction is not configured. Complete or check the invoice details manually." };
  }
  try {
    const ai = validatedExtraction(await dependencies.readDocument(bytes, mime));
    // Keep valid parser values. Only fill gaps; never silently replace them.
    for (const key of Object.keys(details) as (keyof InvoiceDetails)[]) details[key] ??= ai[key];
    return { details, requiresReview: true, warning: "AI helped read this document. Check the details against the preview, then save the invoice." };
  } catch {
    return { details, requiresReview: true, warning: "AI could not read this document. Any available text details have been kept; complete or check the form manually." };
  }
}
