export type InvoiceView = "active" | "paid" | "all";

export function invoiceView(value: string | string[] | undefined): InvoiceView {
  return value === "active" || value === "paid" ? value : "all";
}

export function invoiceListUrl(view: InvoiceView): string {
  return view === "all" ? "/invoices" : `/invoices?view=${view}`;
}

export function invoiceEditUrl(id: string, view: InvoiceView): string {
  return `/invoices/${id}/edit${view === "all" ? "" : `?view=${view}`}`;
}
