# CYC Cohort 2026 - Works on My Machine

1. Project Overview

- What problem are we solving?
- Who is the application for?
- What is our proposed solution?
- What does success look like?

2. Minimum Viable Product (MVP)

Goal: Build a working prototype that processes a PDF bill and supports human review.

Proposed workflow:

1. Upload a PDF invoice.
2. Extract vendor, amount, due date, and invoice ID.
3. Display extracted information for review and correction.
4. Allow the user to approve or reject.
5. Save the decision and allow it to be retrieved.

Out of scope for the initial MVP:

-Real Payments
-Automated vendor website interactions
-Email Invoice ingestion
-Fully autonomous payment processing

3. Technology Stack

Pending team decision - Jira DC-40

-Frontend:
-Backend:
-Database:
-PDF extraction:
-Hosting/deployment:
-Testing:

4. Getting Started

To be completed once the stack is finalized.

-Prerequisites
-Close the repository
-install dependencies
-Configure local environment
-start the application
-Run tests

5. Project Structure

Document the actual folder structure after the project is initialized.

6. Frontend UI: CoreUI

The frontend (`frontend/`) uses [CoreUI for React](https://coreui.io/react/docs/getting-started/introduction/) (`@coreui/react` + `@coreui/coreui`) for components and base styles, with Sass for customization. Tailwind is **not** used.

**Where things live**

```
frontend/
├── styles/
│   ├── _variables.scss   ← CoreUI variable overrides (theme colors, fonts, spacing)
│   └── main.scss         ← global entry: loads variables, then all of CoreUI
└── app/
    └── invoices/upload/
        ├── page.tsx            ← Server Component
        ├── upload.client.tsx   ← Client Component sibling (state, handlers)
        └── upload.module.scss  ← sidecar styles for custom classes
```

**Conventions**

- `page.tsx` stays a Server Component. Interactive UI goes in a sibling `*.client.tsx` file with `"use client"` at the top.
- Which CoreUI components can go where:
  - **In `page.tsx` (server):** use only layout components (`CContainer`, `CRow`, `CCol`, `CCard`, `CCardHeader`, `CCardBody`). For link buttons, use Next's `Link` with CoreUI's classes: `<Link href="/x" className="btn btn-primary">`.
  - **Everything else** (`CButton`, `CFormInput`, `CAlert`, `CModal`, `CDropdown`, ...) uses React hooks, so it goes in the `*.client.tsx` file and is imported from `@coreui/react`.
  - **Not sure which kind a component is?** If `npm run build` fails with `useState is not a function`, move that component into the client file.
- Use CoreUI components and utility classes (`mb-3`, `d-flex`, `text-body-secondary`) first. Custom classes go in a `.module.scss` file next to the component.
- Don't add global element styles (`input { ... }`, `button { ... }`). They override CoreUI. Any global styles belong in `styles/main.scss`, below the CoreUI import.

**Customizing the theme**

Add Sass variable overrides inside the `with (...)` map in `styles/_variables.scss`. Any variable from `node_modules/@coreui/coreui/scss/_variables.scss` can be overridden:

```scss
@forward "@coreui/coreui/scss/variables" with (
  $primary: #2563eb !default,
  $border-radius: 0.5rem !default,
);
```

**Using CoreUI variables and mixins in a module**

`_variables.scss` outputs no CSS, so modules can import it without duplicating CoreUI:

```scss
// app/example.module.scss
@use "../styles/variables" as *;

.panel {
  padding: $spacer;
  border-radius: $border-radius-lg;

  @include media-breakpoint-up(md) {
    padding: $spacer * 2;
  }
}
```

**Reset:** CoreUI includes [Reboot](https://coreui.io/bootstrap/docs/content/reboot/), a Bootstrap-style CSS reset, and `styles/main.scss` already loads it. Don't add another reset.

**Docs**

- [Getting started](https://coreui.io/react/docs/getting-started/introduction/)
- [Sass customization](https://coreui.io/react/docs/customize/sass/), covering variables, maps and the import order
- [CSS variables](https://coreui.io/react/docs/customize/css-variables/), which are the `--cui-*` properties for runtime theming
- [Color modes / dark mode](https://coreui.io/bootstrap/docs/customize/color-modes/)
- [Grid](https://coreui.io/react/docs/layout/grid/)
- [Forms overview](https://coreui.io/react/docs/forms/overview/), [Form input](https://coreui.io/react/docs/forms/input/), [Validation](https://coreui.io/react/docs/forms/validation/)
- [Button](https://coreui.io/react/docs/components/button/), [Card](https://coreui.io/react/docs/components/card/), [Alert](https://coreui.io/react/docs/components/alert/)
- [Spacing utilities](https://coreui.io/bootstrap/docs/utilities/spacing/), [Utility API](https://coreui.io/bootstrap/docs/utilities/api/)

7. Team and Collaboration

-Team 5 members and responsibilities
-How to claim a Jira task
-Branch naming conventions
-Pull request and code review process
-Definition of Done

8. Project Management and Resources

-Jira Project
-Miro Collaboration Board
-GitHub Repository
-Discord team channel
-Sample invoice PDFs

9. Testing and Acceptance Criteria

-PDF upload succeeds.
-Four required fields are extracted from a sample invoice.
-Extracted values can be corrected.
-Invoice can be approved or rejected.
-Saved decisions persist and can be retrieved.
-The complete workflow runs in the deployed application.

10. Sprint Goals and Roadmap

Initial MVP: One deployed, working invoice-review workflow.

Future possibilities:

-Support multiple invoice formats
-Improve extraction accuracy
-Detect duplicate invoices
-Email-based invoice intake
-Payment-provider integrations
-Approval notifications and automation

11. AI Usage Policy

Document the cohort's current restrictions on AI-assisted code generation, including the initial two-week restriction and any additional guidance from the organizers.

12. Contributing

-Select an available Jira issue.
-Confirm ownership.
-Implement and test the change.
-Open a pull request.
-Request review before merging.

13. License

To be determined by the repository owners or cohort organizers.
