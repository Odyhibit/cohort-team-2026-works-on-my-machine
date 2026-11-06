import assert from "node:assert/strict";
import test from "node:test";
import { cents, isDemoPaymentUrl, parsePaymentResult, paymentDecision, paymentPrompt, type PaymentResult, type PaymentSnapshot } from "./payment";

const expected: PaymentSnapshot = {
  payment_url: "https://alder-creek-utility-demo.vercel.app",
  account_number: "2000456709", invoice_number: "BILL-1001", amount: "287.61", currency: "USD",
};
const receipt: PaymentResult = {
  outcome: "succeeded", confirmation_number: "PAY-AE9AE6F0", account_number: "2000456709",
  invoice_number: "BILL-1001", amount: "287.61", currency: "USD", message: "Receipt and history show completed payment.",
};

test("matching structured receipt succeeds, including JSON string fallback", () => {
  assert.deepEqual(parsePaymentResult(JSON.stringify(receipt)), receipt);
  assert.equal(paymentDecision(expected, parsePaymentResult(receipt)).status, "succeeded");
});

test("matching amount and a nonblank confirmation are required", () => {
  for (const [field, value] of Object.entries({
    amount: "287.62", confirmation_number: " ",
  })) {
    assert.equal(paymentDecision(expected, { ...receipt, [field]: value }).status, "uncertain", field);
  }
  for (const field of ["amount", "confirmation_number"] as const) {
    assert.equal(paymentDecision(expected, { ...receipt, [field]: null }).status, "uncertain", field);
  }
});

test("amount comparison uses exact decimal cents", () => {
  assert.equal(cents("0.10"), BigInt(10));
  assert.equal(cents("9999999999.99"), BigInt("999999999999"));
  assert.equal(paymentDecision({ ...expected, amount: "287.60" }, { ...receipt, amount: "287.6" }).status, "succeeded");
  for (const value of ["287.610", "2e2", "$287.61", "287,61", "-1", "NaN", 287.61, null]) assert.equal(cents(value), null);
});

test("review messages identify amount mismatches and missing confirmations", () => {
  const mismatch = paymentDecision(expected, { ...receipt, account_number: "different", amount: "186.42", invoice_number: null });
  assert.equal(mismatch.status, "uncertain");
  assert.match(mismatch.message, /amount: expected "287.61", returned "186.42"/);
  assert.doesNotMatch(mismatch.message, /account number:|invoice number:|currency:/);
  assert.match(paymentDecision(expected, { ...receipt, confirmation_number: null }).message, /confirmation number is missing/);
});

test("demo receipt identifiers and currency are informational, including when omitted", () => {
  const { account_number, invoice_number, currency, ...minimal } = receipt;
  assert.ok(account_number && invoice_number && currency);
  const parsed = parsePaymentResult(minimal);
  assert.ok(parsed);
  assert.equal(parsed.account_number, null);
  assert.equal(parsed.invoice_number, null);
  assert.equal(parsed.currency, null);
  assert.equal(paymentDecision(expected, parsed).status, "succeeded");
  for (const currency of [null, "", "$", "USD", "EUR"]) {
    assert.equal(paymentDecision(expected, { ...receipt, account_number: null, invoice_number: null, currency }).status, "succeeded");
  }
});

test("dollar amounts normalize to exact decimal amounts and imply USD", () => {
  const parsed = parsePaymentResult({ ...receipt, amount: "$287.61", currency: null });
  assert.equal(parsed?.amount, "287.61");
  assert.equal(parsed?.currency, "USD");
  assert.equal(paymentDecision(expected, parsed).status, "succeeded");
  assert.equal(parsePaymentResult({ ...receipt, amount: "$1,287.61", currency: null })?.amount, "1287.61");
  assert.equal(paymentDecision(expected, parsePaymentResult({ ...receipt, amount: "$287.62" })).status, "uncertain");
  for (const amount of ["$2e2", "$28,7.61", "$-287.61"]) {
    assert.equal(paymentDecision(expected, parsePaymentResult({ ...receipt, amount })).status, "uncertain");
  }
});

test("malformed and incomplete agent responses cannot mark an invoice paid", () => {
  for (const value of [null, [], {}, "not JSON", "```json\n{}\n```", { ...receipt, outcome: "done" },
    { ...receipt, extra: true }, { ...receipt, message: null }, { ...receipt, confirmation_number: 123 },
    { ...receipt, confirmation_number: "x".repeat(201) }, { ...receipt, message: "x".repeat(1001) }]) {
    assert.equal(parsePaymentResult(value), null);
    assert.equal(paymentDecision(expected, parsePaymentResult(value)).status, "uncertain");
  }
});

test("only explicit no-submission failure is retryable", () => {
  assert.equal(paymentDecision(expected, { ...receipt, outcome: "failed", confirmation_number: null }).status, "failed");
  assert.equal(paymentDecision(expected, { ...receipt, outcome: "failed" }).status, "uncertain");
  assert.equal(paymentDecision(expected, { ...receipt, outcome: "uncertain", confirmation_number: null }).status, "uncertain");
});

test("only exact HTTPS cohort demo hosts can start a payment", () => {
  assert.ok(isDemoPaymentUrl(expected.payment_url));
  assert.ok(isDemoPaymentUrl("https://sunmeadow-utility-demo.vercel.app/pay?invoice=BILL-1001"));
  for (const value of ["http://alder-creek-utility-demo.vercel.app", "https://example.com", "https://localhost",
    "https://alder-creek-utility-demo.vercel.app.evil.test", "https://evil.alder-creek-utility-demo.vercel.app",
    "https://name:pass@alder-creek-utility-demo.vercel.app", "https://alder-creek-utility-demo.vercel.app:8443", "invalid"]) {
    assert.equal(isDemoPaymentUrl(value), false, value);
    assert.throws(() => paymentPrompt({ ...expected, payment_url: value }));
  }
});

test("prompt carries the invoice data and instructs a single submission and history verification", () => {
  const prompt = paymentPrompt(expected);
  assert.ok(prompt.includes(JSON.stringify(expected)));
  assert.match(prompt, /Submit at most once/);
  assert.match(prompt, /existing receipt instead of paying again/);
  assert.match(prompt, /Never use expected values copied as evidence/);
  assert.match(prompt, /Receipts may omit these identifiers/);
  assert.match(prompt, /do not discard a number you already verified earlier on the site/);
  assert.match(prompt, /treat a dollar sign as USD/i);
  assert.match(prompt, /Missing currency or identifiers alone must not/);
});
