# parser reads site generated alphanumeric bill numbers bill 8e572

Covers: frontend/lib/invoices/invoice-parser.test.ts, frontend/lib/invoices/invoice-parser.ts

Last changed by AI: 2026-11-08 · run 09dce026-d9a6-4547-b5c5-7e010155a444 · files: frontend/lib/invoices/invoice-parser.test.ts, frontend/lib/invoices/invoice-parser.ts

## Current view

frontend/lib/invoices/invoice-parser.ts extracts the invoice number with ordered patterns: BILL-<alphanumeric containing a digit>(-suffix), then INV-, then a generic [A-Z]{2,}-\d{3,} fallback. Vendor demo sites generate hex bill ids (BILL-8E572D6D) and every site PDF has a 'Property PROP-001' header line, so if the BILL pattern misses, the fallback silently returns PROP-001 and Browser Use correctly refuses to pay. HEADER_SUFFIXES uses the same BILL pattern to strip ids from vendor lines (maple-junction layout). Checks: invoice-parser.test.ts uses real site PDF text; extract-invoice.test.ts covers the BILL-1001 fixtures. Limit: invoices saved before this fix keep PROP-001 until reopened and corrected.

## Lessons

## History

### 2026-11-08 · run 09dce026-d9a6-4547-b5c5-7e010155a444 · Parser reads site-generated alphanumeric bill numbers (BILL-8E572D6D) instead of PROP-001, and stri…
**Changed:** Parser now reads alphanumeric site bill numbers (BILL-8E572D6D) instead of falling back to PROP-001, and strips them from vendor lines. Invoices already saved with PROP-001 are not corrected; reopen and fix them manually.
**Learned:** Recorded parser contract for site-generated bill ids and the PROP-001 fallback trap.
**Decisive check:** Planned commands: npm --prefix frontend test; npm --prefix frontend run lint; frontend/node_modules/.bin/tsc -p frontend --noEmit. Final outcomes are not yet claimed; inspect run 09dce026-d9a6-4547-b5c5-7e010155a444 command receipts separately. Local receipts may not travel with source.
**Files:** frontend/lib/invoices/invoice-parser.test.ts@sha256:daa7205aba0c8c8f5bc329813a451face49be69c5e780f5fd978dbffcf63ae80, frontend/lib/invoices/invoice-parser.ts@sha256:61ee80c21cf6958f401e6a87e8b6da1ef6e3967f58044f6d9be2b32c212acb2e
