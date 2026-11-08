# invoice list default view

Covers: frontend/lib/invoices/list-view.test.ts, frontend/lib/invoices/list-view.ts

Last changed by AI: 2026-11-08 · run 1a41103a-5ecf-43ae-b05e-1421aea17a05 · files: frontend/lib/invoices/list-view.test.ts, frontend/lib/invoices/list-view.ts

## Current view

frontend/lib/invoices/list-view.ts is the single resolver for the Invoices list view (active | paid | all). invoiceView() defaults to 'all' for missing or unknown values. invoiceListUrl/invoiceEditUrl omit ?view only for the default 'all'; active and paid carry ?view=. app/invoices/page.tsx uses it to highlight the filter button and to filter (active = status != paid, paid = status = paid, all = no filter); app/invoices/[id]/edit/page.tsx uses it for the back link and login redirect. Bare /invoices links (nav, dashboard, not-found, action redirects) therefore open on All. Check: lib/invoices/list-view.test.ts. Limit: old bookmarks of bare /invoices now show All instead of Active.

## Lessons

## History

### 2026-11-08 · run 1a41103a-5ecf-43ae-b05e-1421aea17a05 · Invoices list page defaults to the All view instead of Active
**Changed:** Invoices list now defaults to All: bare /invoices resolves to the all view; Active uses ?view=active, Paid unchanged. Not verified in a browser.
**Learned:** Recorded where the invoice list default view is decided and the URL contract.
**Decisive check:** Planned commands: npm --prefix frontend test; npm --prefix frontend run lint; frontend/node_modules/.bin/tsc -p frontend --noEmit. Final outcomes are not yet claimed; inspect run 1a41103a-5ecf-43ae-b05e-1421aea17a05 command receipts separately. Local receipts may not travel with source.
**Files:** frontend/lib/invoices/list-view.test.ts@sha256:265b20dcc0a00359210d8fac7f86c12ab92e160fe0c04eff6025ee41a5edc263, frontend/lib/invoices/list-view.ts@sha256:dfae4f69cdfdde59aa441bbb79024899e2fc430790a34f8361bb79d262d410ab
