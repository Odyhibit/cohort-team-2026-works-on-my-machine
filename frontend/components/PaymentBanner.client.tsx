"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CAlert } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { getPaymentBanners } from "@/app/invoices/payment-actions";
import { paymentIcons } from "@/lib/invoices/payment-icons";
import {
  PAYMENT_BANNER_REFRESH, bannerColor, bannerDismissible, bannerIcon, dismissKey, isActive, visibleBanners, type PaymentBannerItem,
} from "@/lib/invoices/payment-banner";

const STORAGE_KEY = "payment-banner-dismissed";

function readDismissed(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch { return []; }
}

function writeDismissed(keys: string[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); } catch { /* storage unavailable */ }
}

export default function PaymentBanner() {
  const pathname = usePathname();
  const [items, setItems] = useState<PaymentBannerItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pendingScroll, setPendingScroll] = useState(false);
  const active = items.some((item) => isActive(item.status));

  // Read storage after mount (async to avoid a hydration mismatch and a synchronous setState in the effect).
  useEffect(() => { void Promise.resolve().then(() => { setDismissed(readDismissed()); setLoaded(true); }); }, []);

  const refresh = useCallback(async (scroll = false) => {
    if (document.visibilityState === "hidden") return;
    try {
      const next = await getPaymentBanners();
      setItems(next);
      if (scroll) setPendingScroll(true);
      if (next.length > 0) {
        const ids = new Set(next.map((item) => item.id));
        setDismissed((previous) => {
          const kept = previous.filter((key) => ids.has(key.slice(0, key.lastIndexOf(":"))));
          if (kept.length === previous.length) return previous;
          writeDismissed(kept);
          return kept;
        });
      }
    } catch { /* keep showing the last known banners */ }
  }, []);

  // Fetch on mount and whenever the route changes.
  useEffect(() => {
    void Promise.resolve().then(() => refresh());
  }, [pathname, refresh]);

  // Poll: quickly while a payment is active, slowly otherwise.
  useEffect(() => {
    let live = true;
    let timer: ReturnType<typeof setTimeout>;
    function schedule() {
      timer = setTimeout(async () => {
        await refresh();
        if (live) schedule();
      }, active ? 5_000 : 30_000);
    }
    schedule();
    return () => { live = false; clearTimeout(timer); };
  }, [active, refresh]);

  useEffect(() => {
    const now = (event: Event) => { void refresh((event as CustomEvent<{ scroll?: boolean }>).detail?.scroll === true); };
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener(PAYMENT_BANNER_REFRESH, now);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener(PAYMENT_BANNER_REFRESH, now);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);

  function dismiss(item: PaymentBannerItem) {
    const key = dismissKey(item);
    setDismissed((previous) => {
      if (previous.includes(key)) return previous;
      const next = [...previous, key];
      writeDismissed(next);
      return next;
    });
  }

  const { shown, hiddenCount } = useMemo(() => visibleBanners(items, dismissed), [items, dismissed]);

  // Scroll to the banners after a user-triggered refresh has rendered them.
  useEffect(() => {
    if (!pendingScroll) return;
    if (loaded && shown.length > 0) {
      window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    void Promise.resolve().then(() => setPendingScroll(false));
  }, [pendingScroll, loaded, shown]);

  if (!loaded) return null;
  if (shown.length === 0) return null;

  return <div className="d-grid gap-2 mb-4">
    {shown.map((item) => <CAlert key={dismissKey(item)} color={bannerColor(item.status)} dismissible={bannerDismissible(item.status)}
      onClose={() => dismiss(item)} className="d-flex align-items-start gap-2 mb-0" role="status" aria-live="polite">
      <CIcon icon={paymentIcons[bannerIcon(item.status)]} className={`flex-shrink-0 mt-1${item.status === "running" ? " payment-banner-spin" : ""}`} aria-hidden="true" />
      <div>
        <div>{item.message}</div>
        {item.run_id && <p className="small mb-0">Browser Use task: <code>{item.run_id}</code></p>}
        <Link href={`/invoices/${item.invoice_id}/edit`} className="alert-link">View invoice {item.reference_number ?? ""}</Link>
      </div>
    </CAlert>)}
    {hiddenCount > 0 && <p className="small text-body-secondary mb-0">+{hiddenCount} more {hiddenCount === 1 ? "payment" : "payments"}</p>}
  </div>;
}
