import assert from "node:assert/strict";
import test from "node:test";
import { addDismissed, mergeAttemptRows, bannerInvoiceLabel, bannerColor, bannerLabel, bannerDismissible, bannerIcon, dismissKey, isActive, latestPerInvoice, visibleBanners, type PaymentBannerItem } from "./payment-banner";

const item = (id: string, status: PaymentBannerItem["status"], updated_at: string, invoice_id = id): PaymentBannerItem => ({
  id, status, updated_at, created_at: updated_at, run_id: null, message: "m",
  suggested_confirmation: null, invoice_id, reference_number: "R-1", vendor_name: "Acme", amount: 10,
});

test("invoice label joins vendor, reference and amount", () => {
  assert.equal(bannerInvoiceLabel({ vendor_name: "Summit Trail Equipment Rental", reference_number: "BILL-1001", amount: 287.61 }),
    "Summit Trail Equipment Rental · BILL-1001 · $287.61");
  assert.equal(bannerInvoiceLabel({ vendor_name: "V", reference_number: "R", amount: "287.6" }), "V · R · $287.60");
  assert.equal(bannerInvoiceLabel({ vendor_name: null, reference_number: "BILL-1001", amount: 5 }), "BILL-1001 · $5.00");
  assert.equal(bannerInvoiceLabel({ vendor_name: "V", reference_number: null, amount: "abc" }), "V");
  assert.equal(bannerInvoiceLabel({ vendor_name: null, reference_number: null, amount: null }), "View invoice");
});

test("each status maps to a color, icon and dismissibility", () => {
  const expected = {
    starting: ["info", "cilInfo", false], running: ["info", "cilSync", false],
    succeeded: ["success", "cilCheckCircle", true], failed: ["danger", "cilXCircle", true],
    uncertain: ["warning", "cilWarning", true],
  } as const;
  for (const [status, [color, icon, dismissible]] of Object.entries(expected)) {
    const s = status as PaymentBannerItem["status"];
    assert.equal(bannerColor(s), color);
    assert.equal(bannerIcon(s), icon);
    assert.equal(bannerDismissible(s), dismissible);
    assert.equal(isActive(s), !dismissible);
  }
});

test("each status has a label", () => {
  const expected = { starting: "Starting", running: "In progress", succeeded: "Paid", failed: "Failed", uncertain: "Needs review" } as const;
  for (const [status, label] of Object.entries(expected)) assert.equal(bannerLabel(status as PaymentBannerItem["status"]), label);
});

test("dismissed keys are filtered, and a status change produces a new key", () => {
  const a = item("a", "failed", "2026-11-05T00:00:00Z");
  const b = item("b", "succeeded", "2026-11-05T01:00:00Z");
  assert.deepEqual(visibleBanners([a, b], new Set([dismissKey(a)])).shown, [b]);
  assert.deepEqual(visibleBanners([a, b], [dismissKey(b)]).shown, [a]);
  assert.notEqual(dismissKey(a), dismissKey({ ...a, status: "uncertain" }));
  assert.deepEqual(visibleBanners([{ ...a, status: "uncertain" }], [dismissKey(a)]).shown.length, 1);
});

test("shows at most 3 and counts the rest", () => {
  const all = [1, 2, 3, 4, 5].map((n) => item(`a${n}`, "succeeded", `2026-11-05T0${n}:00:00Z`));
  const { shown, hiddenCount } = visibleBanners(all, []);
  assert.equal(shown.length, 3);
  assert.equal(hiddenCount, 2);
  assert.deepEqual(shown.map((a) => a.id), ["a5", "a4", "a3"]);
  assert.equal(visibleBanners(all, [], 10).hiddenCount, 0);
});

test("active attempts sort first, then newest", () => {
  const old = item("old", "running", "2026-11-05T00:00:00Z");
  const newer = item("new", "failed", "2026-11-05T09:00:00Z");
  const newest = item("newest", "uncertain", "2026-11-05T10:00:00Z");
  assert.deepEqual(visibleBanners([newest, newer, old], []).shown.map((a) => a.id), ["old", "newest", "new"]);
});

test("only the latest attempt per invoice is shown", () => {
  const older = item("older", "failed", "2026-11-05T00:00:00Z", "inv");
  const newer = item("newer", "failed", "2026-11-05T01:00:00Z", "inv");
  assert.deepEqual(visibleBanners([older, newer], []).shown, [newer]);
  assert.deepEqual(latestPerInvoice([newer, older]), [newer]);
});

test("dismissing the newest attempt does not resurface an older one", () => {
  const older = item("older", "failed", "2026-11-05T00:00:00Z", "inv");
  const newer = item("newer", "failed", "2026-11-05T01:00:00Z", "inv");
  assert.deepEqual(visibleBanners([older, newer], [dismissKey(newer)]).shown, []);
});

test("different invoices are both kept", () => {
  const a = item("a", "failed", "2026-11-05T00:00:00Z", "inv-a");
  const b = item("b", "failed", "2026-11-05T01:00:00Z", "inv-b");
  assert.deepEqual(visibleBanners([a, b], []).shown, [b, a]);
});

test("active rows are kept even when recent rows fill the limit, active first, duplicates removed", () => {
  const active = [{ id: "act" }, { id: "dup" }];
  const recent = [{ id: "dup" }, ...Array.from({ length: 49 }, (_, n) => ({ id: `r${n}` }))];
  const merged = mergeAttemptRows(active, recent);
  assert.equal(merged.length, 51);
  assert.deepEqual(merged.slice(0, 2).map((r) => r.id), ["act", "dup"]);
  assert.equal(new Set(merged.map((r) => r.id)).size, merged.length);
});

test("addDismissed appends, avoids duplicates and caps keeping the newest", () => {
  assert.deepEqual(addDismissed(["a"], "b"), ["a", "b"]);
  assert.deepEqual(addDismissed(["a", "b"], "a"), ["b", "a"]);
  assert.deepEqual(addDismissed(["a", "b", "c"], "d", 3), ["b", "c", "d"]);
});
