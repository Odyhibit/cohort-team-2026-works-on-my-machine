import assert from "node:assert/strict";
import test from "node:test";
import { paymentView } from "./payment-view";
import type { PaymentAttempt } from "./payment";

const attempt: PaymentAttempt = {
  id: "attempt", invoice_id: "invoice", run_id: "run", status: "uncertain",
  message: "Review the receipt", created_at: "2026-11-05T00:00:00Z",
  expected: { payment_url: "https://example.com", account_number: "123", invoice_number: "INV-1", amount: "10.00", currency: "USD" },
};

test("saved results expose a suggested confirmation without the full result or expected snapshot", () => {
  for (const result of [{ confirmation_number: " PAY-123 ", extra: "private data" }, JSON.stringify({ confirmation_number: "PAY-123" })]) {
    const view = paymentView({ ...attempt, result });
    assert.equal(view.suggested_confirmation, "PAY-123");
    assert.equal(view.status, "uncertain");
    assert.equal("result" in view, false);
    assert.equal("expected" in view, false);
  }
});

test("missing or malformed suggestions leave the review field blank", () => {
  for (const result of [undefined, null, "invalid JSON", [], {}, { confirmation_number: null },
    { confirmation_number: " " }, { confirmation_number: 123 }, { confirmation_number: "x".repeat(201) }]) {
    assert.equal(paymentView({ ...attempt, result }).suggested_confirmation, null);
  }
});
