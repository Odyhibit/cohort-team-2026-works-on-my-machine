import assert from "node:assert/strict";
import test from "node:test";
import { geminiRequestError } from "./ai-extraction-errors";
import { emptyInvoiceDetails, extractWithFallback } from "./extraction";

test("Gemini invalid-key HTTP 400 is distinguished from an invalid document request", () => {
  const error = geminiRequestError(400, { error: {
    message: "raw provider message must not be shown",
    details: [{ reason: "API_KEY_INVALID" }],
  } });
  assert.equal(error.code, "invalid_key");
  assert.match(error.message, /GEMINI_API_KEY/);
  assert.doesNotMatch(error.message, /raw provider/);
  assert.equal(geminiRequestError(400, {}).code, "request");
});

test("provider status codes produce useful fixed messages without exposing response contents", () => {
  for (const [status, code] of [[401, "invalid_key"], [403, "permission"], [404, "model"], [429, "quota"], [503, "unavailable"]] as const) {
    const error = geminiRequestError(status, { error: { message: "secret key and invoice contents" } });
    assert.equal(error.code, code);
    assert.doesNotMatch(error.message, /secret key and invoice contents/);
  }
  for (const body of [null, "invalid", { error: null }, { error: { details: [null, {}, "invalid"] } }]) {
    assert.equal(geminiRequestError(400, body).code, "request");
  }
});

test("key failures reach the form as an actionable warning while retaining parser values", async () => {
  const partial = { ...emptyInvoiceDetails, invoiceNumber: "INV-123" };
  const result = await extractWithFallback(new Uint8Array(), "application/pdf", {
    parsePdf: async () => partial,
    readDocument: async () => { throw geminiRequestError(400, { error: { details: [{ reason: "API_KEY_INVALID" }] } }); },
  });
  assert.deepEqual(result.details, partial);
  assert.equal(result.requiresReview, true);
  assert.match(result.warning!, /Google rejected the Gemini API key/);
});
