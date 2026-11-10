import assert from "node:assert/strict";
import test from "node:test";
import { formatEventTime } from "./time";

test("Central fallback converts the UTC instant, including the previous calendar day", () => {
  const text = formatEventTime("2026-11-09T01:30:00Z");
  assert.match(text, /Nov 8, 2026/);
  assert.match(text, /7:30\s*PM CST/);
});

test("Central time follows daylight saving rather than a fixed UTC offset", () => {
  assert.match(formatEventTime("2026-07-09T18:30:00Z"), /1:30\s*PM CDT/);
  assert.match(formatEventTime("2026-11-09T18:30:00Z"), /12:30\s*PM CST/);
});

test("viewer time zones override Central; unavailable zones fall back safely", () => {
  assert.match(formatEventTime("2026-11-09T01:30:00Z", "America/Los_Angeles"), /5:30\s*PM PST/);
  assert.equal(formatEventTime("2026-11-09T01:30:00Z", "invalid-zone"), formatEventTime("2026-11-09T01:30:00Z"));
  assert.equal(formatEventTime("invalid date"), "invalid date");
});
