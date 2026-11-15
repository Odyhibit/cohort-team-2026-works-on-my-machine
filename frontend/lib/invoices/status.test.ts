import assert from "node:assert/strict";
import test from "node:test";
import { invoiceStatusLabels, isInvoiceLocked, isInvoiceStatus } from "./status";

test("payment processing is a recognized, locked invoice state", () => {
  assert.ok(isInvoiceStatus("payment processing"));
  assert.equal(invoiceStatusLabels["payment processing"], "Payment Processing");
  for (const status of ["approved", "payment processing", "paid"]) assert.ok(isInvoiceLocked(status));
  for (const status of ["created", "waiting on approval", undefined, null]) assert.equal(isInvoiceLocked(status), false);
});

test("autopay failures remain locked until reopened and are distinct from pending payments", () => {
  assert.ok(isInvoiceStatus("autopay failed"));
  assert.equal(invoiceStatusLabels["autopay failed"], "Autopay failed");
  assert.ok(isInvoiceLocked("autopay failed"));
  assert.ok(isInvoiceStatus("payment processing"));
  assert.equal(isInvoiceStatus("failed"), false);
});
