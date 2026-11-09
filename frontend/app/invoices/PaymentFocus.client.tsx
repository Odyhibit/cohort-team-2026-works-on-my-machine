"use client";

import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

// A nonmodal dialog: only page content becomes inert; app navigation stays usable.
export default function PaymentFocus({ active, labelledBy, children }: {
  active: boolean; labelledBy: string; children: ReactNode;
}) {
  const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const host = mounted ? document.getElementById("payment-focus-root") : null;
  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!active || !host) return;
    const background = Array.from(document.querySelectorAll<HTMLElement>("[data-payment-content]"));
    const previousInert = background.map((element) => element.getAttribute("inert"));
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const currentPanel = panel.current;
    const header = document.querySelector<HTMLElement>(".header");
    const position = () => overlay.current?.style.setProperty("--payment-focus-top", `${Math.max(0, header?.getBoundingClientRect().bottom ?? 0)}px`);

    background.forEach((element) => element.setAttribute("inert", ""));
    document.body.style.overflow = "hidden";
    position();
    currentPanel?.focus({ preventScroll: true });
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(position) : null;
    if (header) observer?.observe(header);
    window.addEventListener("resize", position);

    // React Activity hides retained routes without unmounting them. Layout-effect
    // cleanup releases the background and scroll lock immediately on navigation.
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", position);
      background.forEach((element, index) => {
        if (previousInert[index] === null) element.removeAttribute("inert");
        else element.setAttribute("inert", previousInert[index]!);
      });
      document.body.style.overflow = previousOverflow;
      if (currentPanel?.contains(document.activeElement) && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active, host]);

  if (!active || !host) return children;
  return createPortal(
    <div ref={overlay} className="payment-focus-overlay">
      <div ref={panel} className="payment-focus-panel" role="dialog" aria-modal="false" aria-labelledby={labelledBy} tabIndex={-1}>
        {children}
      </div>
    </div>, host,
  );
}
