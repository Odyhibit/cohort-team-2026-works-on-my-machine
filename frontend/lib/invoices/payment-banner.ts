import type { PaymentView } from "./payment-view";

export const PAYMENT_BANNER_REFRESH = "payment-banner:refresh";

export type PaymentBannerItem = PaymentView & { invoice_id: string; reference_number: string | null; vendor_name: string | null; amount: number | null; updated_at: string };
type Status = PaymentView["status"];
type Keyed = Pick<PaymentBannerItem, "id" | "status">;

export const isActive = (status: Status) => status === "starting" || status === "running";
export const bannerDismissible = (status: Status) => !isActive(status);
export const dismissKey = (a: Keyed) => `${a.id}:${a.status}`;

export function bannerColor(status: Status): "info" | "success" | "danger" | "warning" {
  if (status === "succeeded") return "success";
  if (status === "failed") return "danger";
  if (status === "uncertain") return "warning";
  return "info";
}

export function bannerIcon(status: Status): "cilInfo" | "cilSync" | "cilCheckCircle" | "cilXCircle" | "cilWarning" {
  if (status === "running") return "cilSync";
  if (status === "succeeded") return "cilCheckCircle";
  if (status === "failed") return "cilXCircle";
  if (status === "uncertain") return "cilWarning";
  return "cilInfo";
}

export function bannerLabel(status: Status): string {
  if (status === "starting") return "Starting";
  if (status === "running") return "In progress";
  if (status === "succeeded") return "Paid";
  if (status === "failed") return "Failed";
  return "Needs review";
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function bannerInvoiceLabel(item: Pick<PaymentBannerItem, "vendor_name" | "reference_number"> & { amount: number | string | null }): string {
  const amount = item.amount === null || item.amount === "" ? NaN : Number(item.amount);
  const parts = [item.vendor_name, item.reference_number, Number.isNaN(amount) ? null : currency.format(amount)]
    .filter((p): p is string => !!p && p.trim() !== "");
  return parts.length > 0 ? parts.join(" · ") : "View invoice";
}

export function requestBannerRefresh(options?: { scroll?: boolean }) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PAYMENT_BANNER_REFRESH, { detail: { scroll: options?.scroll === true } }));
}

export function latestPerInvoice<T extends Pick<PaymentBannerItem, "invoice_id" | "created_at">>(attempts: T[]): T[] {
  const latest = new Map<string, T>();
  for (const a of attempts) {
    const cur = latest.get(a.invoice_id);
    if (!cur || (Date.parse(a.created_at) || 0) > (Date.parse(cur.created_at) || 0)) latest.set(a.invoice_id, a);
  }
  return attempts.filter((a) => latest.get(a.invoice_id) === a);
}

export function visibleBanners<T extends Pick<PaymentBannerItem, "id" | "status" | "invoice_id" | "created_at"> & { updated_at?: string }>(
  attempts: T[], dismissedKeys: Set<string> | string[], max = 3,
): { shown: T[]; hiddenCount: number } {
  const dismissed = dismissedKeys instanceof Set ? dismissedKeys : new Set(dismissedKeys);
  const time = (a: T) => Date.parse(a.updated_at ?? a.created_at) || 0;
  const open = latestPerInvoice(attempts).filter((a) => !dismissed.has(dismissKey(a)))
    .sort((a, b) => Number(isActive(b.status)) - Number(isActive(a.status)) || time(b) - time(a));
  return { shown: open.slice(0, max), hiddenCount: Math.max(0, open.length - max) };
}
