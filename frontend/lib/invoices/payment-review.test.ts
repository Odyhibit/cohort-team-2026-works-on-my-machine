import assert from "node:assert/strict";
import test from "node:test";
import { checkPaymentTaskForReview } from "./payment-review";

test("manual review accepts a terminal task or a missing saved task ID", async () => {
  await checkPaymentTaskForReview(null, async () => { assert.fail("No task to look up"); });
  for (const status of ["completed", "failed", "cancelled"]) {
    await checkPaymentTaskForReview("run", async (id) => { assert.equal(id, "run"); return { status }; });
  }
});

test("a task no longer visible to the configured account does not trap a reviewed invoice", async () => {
  await checkPaymentTaskForReview("other-account-run", async () => {
    throw Object.assign(new Error("Browser Use returned HTTP 404"), { httpStatus: 404 });
  });
});

test("manual review still refuses to settle an active or unknown task", async () => {
  for (const status of ["queued", "dispatching", "running"]) {
    await assert.rejects(checkPaymentTaskForReview("run", async () => ({ status })), /still running/);
  }
  await assert.rejects(checkPaymentTaskForReview("run", async () => ({ status: "unexpected" })), /could not be verified/);
});

test("authentication, quota, provider and network failures are not treated as missing tasks", async () => {
  for (const httpStatus of [401, 403, 429, 500]) {
    const error = Object.assign(new Error("Provider failure"), { httpStatus });
    await assert.rejects(checkPaymentTaskForReview("run", async () => { throw error; }), (actual) => actual === error);
  }
  const network = new Error("Network unavailable");
  await assert.rejects(checkPaymentTaskForReview("run", async () => { throw network; }), (actual) => actual === network);
});
