export const invoiceStatuses = ["created", "waiting on approval", "approved", "paid"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  created: "Created",
  "waiting on approval": "Waiting on approval",
  approved: "Approved",
  paid: "Paid",
};

export function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return invoiceStatuses.includes(value as InvoiceStatus);
}
