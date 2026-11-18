# What makes up the Invoice App?

A one-page view of the tech stack. Versions come from [`frontend/package.json`](../frontend/package.json); check there before relying on a version number.

## Frontend

- **Next.js 16** (App Router, server and client components)
- **React 19 + TypeScript** (UI and type safety)
- **CoreUI for React** (UI components and icons)
- **Sass / SCSS** (styling, via `frontend/styles/main.scss`)

## Backend

- **Next.js Server Actions + Route Handlers** (`frontend/app/**/actions.ts`, `frontend/app/api/`)
- **Supabase** (auth, storage and data access through `@supabase/ssr` and `@supabase/supabase-js`)
- **Workflow SDK** (durable background polling for payments, in `frontend/workflows/`)
- **pdf-parse** (text extraction from uploaded PDF invoices)
- **Vercel** (hosting and deployment)

## Database

- **PostgreSQL** (hosted by Supabase)
- **Supabase migrations** (schema history, in `frontend/supabase/migrations/`)

## Testing & Quality

- **Node test runner + tsx** (unit tests, `lib/**/*.test.ts`)
- **jsdom** (DOM environment for tests)
- **ESLint** (linting)
- **GitHub Actions** (PR validation: lint, types, tests and build)

## Tools

- **GitHub** (source control and pull requests)
- **Jira** (ticket tracking, project DC)
- **Miro** (whiteboarding, research and wireframes)
- **Discord** (team decisions and communication)

## APIs

- **Google Gemini** (AI fallback for reading scanned or incomplete invoices)
- **Browser Use** (automates mock payments on the fictional vendor websites)
- **Mock vendor sites** (fictional utility payment portals hosted on Vercel)

## Related docs

- [Code patterns](./code-patterns/index.md): how the Next.js and Supabase pieces fit together
- [AI invoice extraction plan](./PLANS/ai-invoice-extraction.md)
- [Browser Use payments plan](./PLANS/browser-use-payments.md)
