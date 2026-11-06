import assert from "node:assert/strict";
import test from "node:test";
import { emptyInvoiceDetails, extractWithFallback, validatedExtraction } from "./extraction";

const full = {
  vendorName: "Sample Utility", propertyName: "Sample Workshop", invoiceNumber: "INV-123",
  amountDue: "123.45", dueDate: "2026-11-16", paymentUrl: "https://example.com/pay",
};
const bytes = new Uint8Array([1]);

test("complete text invoices skip the AI API, including when optional URL is missing", async () => {
  const details = { ...full, paymentUrl: null };
  const result = await extractWithFallback(bytes, "application/pdf", {
    parsePdf: async () => details,
    readDocument: async () => { assert.fail("complete invoices must not incur an AI call"); },
  });
  assert.deepEqual(result, { details, requiresReview: false });
});

test("incomplete PDFs fill gaps from AI without replacing parsed values or auto-saving", async () => {
  let calls = 0;
  const result = await extractWithFallback(bytes, "application/pdf", {
    parsePdf: async () => ({ ...full, propertyName: null, dueDate: null }),
    readDocument: async (_bytes, mime) => {
      calls++;
      assert.equal(mime, "application/pdf");
      return { ...full, amountDue: "999.00" };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result.details, full);
  assert.equal(result.requiresReview, true);
  assert.match(result.warning!, /Check the details/);
});

test("PDF text failures and image-only PDFs still reach the document reader", async () => {
  for (const parsePdf of [async () => { throw new Error("no usable text layer"); }, async () => emptyInvoiceDetails]) {
    const result = await extractWithFallback(bytes, "application/pdf", { parsePdf, readDocument: async () => full });
    assert.deepEqual(result.details, full);
    assert.equal(result.requiresReview, true);
  }
});

test("all supported images bypass the PDF parser and always require review", async () => {
  for (const mime of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
    const result = await extractWithFallback(bytes, mime, {
      parsePdf: async () => { assert.fail("an image cannot be parsed as PDF text"); },
      readDocument: async (_bytes, detectedMime) => { assert.equal(detectedMime, mime); return full; },
    });
    assert.deepEqual(result.details, full);
    assert.equal(result.requiresReview, true);
  }
});

test("missing key and provider failures preserve partial data for manual correction", async () => {
  const partial = { ...full, invoiceNumber: null };
  for (const readDocument of [undefined, async () => { throw new Error("provider unavailable or invalid JSON"); }]) {
    const result = await extractWithFallback(bytes, "application/pdf", { parsePdf: async () => partial, readDocument });
    assert.deepEqual(result.details, partial);
    assert.equal(result.requiresReview, true);
    assert.match(result.warning!, /manually/);
    assert.doesNotMatch(result.warning!, /provider unavailable/);
  }
});

test("unreadable documents stay empty rather than inventing values", async () => {
  const result = await extractWithFallback(bytes, "image/png", {
    parsePdf: async () => full, readDocument: async () => emptyInvoiceDetails,
  });
  assert.deepEqual(result.details, emptyInvoiceDetails);
  assert.equal(result.requiresReview, true);
});

test("malformed values are discarded before the fallback completeness check", async () => {
  const result = await extractWithFallback(bytes, "application/pdf", {
    parsePdf: async () => ({ ...full, amountDue: "-50", dueDate: "2026-02-30" }),
    readDocument: async () => full,
  });
  assert.deepEqual(result.details, full);
  assert.equal(result.requiresReview, true);
});

test("document validation rejects invalid dates, amounts, types and unsafe URLs", () => {
  for (const amountDue of ["0", "-1", "NaN", "1,000.00", "$12.00", "1.234", 15]) {
    assert.equal(validatedExtraction({ ...full, amountDue }).amountDue, null);
  }
  for (const dueDate of ["2026-02-29", "2026-04-31", "11/16/2026", "2026-13-01"]) {
    assert.equal(validatedExtraction({ ...full, dueDate }).dueDate, null);
  }
  for (const paymentUrl of ["javascript:alert(1)", "http://example.com", "https://user:pass@example.com", "not a URL"]) {
    assert.equal(validatedExtraction({ ...full, paymentUrl }).paymentUrl, null);
  }
  assert.equal(validatedExtraction({ ...full, dueDate: "2028-02-29" }).dueDate, "2028-02-29");
  assert.deepEqual(validatedExtraction(null), emptyInvoiceDetails);
  assert.deepEqual(validatedExtraction({ vendorName: {}, propertyName: " ", invoiceNumber: "x".repeat(201) }), emptyInvoiceDetails);
});
