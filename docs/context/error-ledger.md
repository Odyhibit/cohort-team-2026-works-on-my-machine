# Error ledger

Failed attempts and how they were resolved. Newest first.

## 2026-11-08 · run 1a41103a · Invoices list defaults to All

- **Failed:** CYC proof-review continuation was sent with unfilled template placeholders and an empty `boundary`, which used up the continuation limit. The product code had no failed fix.
- **Resolved:** retried the build stage with the source unchanged, then finished with every proof case filled in (category, reason, boundary).
- **Lesson:** fill proof-review cases by editing the parsed JSON (`category`, `reason`, `boundary`), not by text replacement that depends on indentation.
