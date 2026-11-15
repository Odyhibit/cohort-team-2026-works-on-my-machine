export const invoiceStatuses = ["created", "waiting on approval", "approved", "payment processing", "autopay failed", "paid"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  created: "Created",
  "waiting on approval": "Waiting on approval",
  approved: "Approved",
  "payment processing": "Payment Processing",
  "autopay failed": "Autopay failed",
  paid: "Paid",
};

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus);
}

export function isInvoiceLocked(status: unknown): boolean {
  return status === "approved" || status === "payment processing" || status === "autopay failed" || status === "paid";
}
