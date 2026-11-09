import { test } from "node:test";
import assert from "node:assert/strict";
import { invoiceEditUrl, invoiceListUrl, invoiceView } from "./list-view";

test("invoice list defaults to All when no view is given", () => {
  assert.equal(invoiceView(undefined), "all");
  assert.equal(invoiceView("bogus"), "all");
  assert.equal(invoiceView(["active", "paid"]), "all");
});

test("explicit views are kept", () => {
  assert.equal(invoiceView("active"), "active");
  assert.equal(invoiceView("paid"), "paid");
  assert.equal(invoiceView("all"), "all");
});

test("list and edit URLs round-trip every view", () => {
  for (const view of ["active", "paid", "all"] as const) {
    const listQuery = new URL(invoiceListUrl(view), "http://x").searchParams.get("view") ?? undefined;
    const editQuery = new URL(invoiceEditUrl("id-1", view), "http://x").searchParams.get("view") ?? undefined;
    assert.equal(invoiceView(listQuery), view);
    assert.equal(invoiceView(editQuery), view);
  }
  assert.equal(invoiceListUrl("all"), "/invoices");
  assert.equal(invoiceListUrl("active"), "/invoices?view=active");
  assert.equal(invoiceEditUrl("id-1", "all"), "/invoices/id-1/edit");
});
