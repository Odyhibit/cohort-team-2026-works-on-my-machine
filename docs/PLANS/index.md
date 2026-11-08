# Plans

Implementation plans for upcoming work. Each plan lists its status, the files it targets, phases with checkboxes, and open decisions. **Resolve the "Decisions needed" section before implementing.**

| Plan | Status | Summary |
|---|---|---|
| [invoice-approval-rules.md](./invoice-approval-rules.md) | In progress; phase checklist out of date | Evaluate new invoices at intake, protect status transitions, and configure thresholds on `/rules`. AI extraction and payments have their own plans below |
| [browser-use-payments.md](./browser-use-payments.md) | Implemented; configuration pending | Hosted demo payments, locked processing status, durable background completion, and deployment setup |
| [ai-invoice-extraction.md](./ai-invoice-extraction.md) | Implemented; configuration pending | AI fallback for incomplete PDFs and scanned images; complete results save and run the existing rules/payment workflow automatically |

## Adding a plan

- One plan per file, in kebab-case: `feature-name.md`
- Include: status, target files, current state, phases with checkboxes, decisions needed, out of scope
- Follow [code-patterns/](../code-patterns/index.md)
- Add a row to the table above and update the status as work moves forward
