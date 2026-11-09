import assert from "node:assert/strict";
import test from "node:test";
import { Activity, act, createElement as element } from "react";
import { JSDOM } from "jsdom";
import PaymentFocus from "../../app/invoices/PaymentFocus.client";

test("payment focus blocks page content while preserving navigation and releases retained pages", async () => {
  const dom = new JSDOM(`<!doctype html><html><body><div class="wrapper">
    <header class="header"><button id="navigation">Invoices</button></header>
    <div id="payment-focus-root"></div>
    <main data-payment-content><div id="app"></div></main>
  </div></body></html>`, { url: "http://localhost" });
  const globals = { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true };
  const originals = Object.keys(globals).map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const);
  for (const [name, value] of Object.entries(globals)) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  const { createRoot } = await import("react-dom/client");
  const app = dom.window.document.getElementById("app")!;
  const root = createRoot(app);
  const background = dom.window.document.querySelector("[data-payment-content]")!;
  const portal = dom.window.document.getElementById("payment-focus-root")!;
  const navigation = dom.window.document.getElementById("navigation")!;
  Object.defineProperty(dom.window.document.querySelector(".header"), "getBoundingClientRect", { value: () => ({ bottom: 112 }) });
  const render = (active: boolean, mode: "visible" | "hidden" = "visible") => root.render(element(Activity, {
    mode, children: element(PaymentFocus, { active, labelledBy: "payment-title", children: element("section", null,
      element("h2", { id: "payment-title" }, "Demo payment"),
      element("button", { id: "check" }, "Check payment status"),
    ) }),
  }));
  try {
    navigation.focus();
    await act(() => render(true));
    assert.ok(background.hasAttribute("inert"));
    assert.equal(navigation.closest("[inert]"), null);
    assert.equal(dom.window.document.body.style.overflow, "hidden");
    const dialog = portal.querySelector('[role="dialog"]')!;
    assert.equal(dialog.getAttribute("aria-modal"), "false");
    assert.equal(dialog.getAttribute("aria-labelledby"), "payment-title");
    assert.equal(dom.window.document.activeElement, dialog);
    assert.equal(portal.querySelector<HTMLElement>(".payment-focus-overlay")!.style.getPropertyValue("--payment-focus-top"), "112px");

    // Navigation stays usable; cleanup must not steal focus back from it.
    navigation.focus();
    await act(() => render(true, "hidden"));
    assert.equal(background.hasAttribute("inert"), false);
    assert.equal(dom.window.document.body.style.overflow, "");
    assert.equal(dom.window.document.activeElement, navigation);
    const hiddenOverlay = portal.querySelector<HTMLElement>(".payment-focus-overlay");
    assert.ok(!hiddenOverlay || hiddenOverlay.style.display === "none", "cached pages must not leave a visible backdrop behind");

    await act(() => render(true));
    assert.ok(background.hasAttribute("inert"));
    await act(() => render(false));
    assert.equal(background.hasAttribute("inert"), false);
    assert.equal(dom.window.document.body.style.overflow, "");
    assert.equal(portal.querySelector('[role="dialog"]'), null);
    assert.ok(app.querySelector("section"));

    // Preserve a preexisting inert state and scroll setting on complete unmount.
    background.setAttribute("inert", "");
    dom.window.document.body.style.overflow = "auto";
    await act(() => render(true));
    await act(() => root.unmount());
    assert.ok(background.hasAttribute("inert"));
    assert.equal(dom.window.document.body.style.overflow, "auto");
  } finally {
    await act(() => root.unmount());
    dom.window.close();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  }
});
