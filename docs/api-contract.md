# Works on My Machine — MVP API Contract

**Version:** 0.1 (Draft)  
**Date:** October 24, 2026  
**Team:** CYC Cohort, Team 5  
**Jira:** DC-18  
**Status:** Proposed for team review

## 1. Overview

This document defines the proposed API interfaces between the frontend and backend for the MVP invoice workflow.

The implementation will build on the existing Next.js, CoreUI, and Supabase infrastructure, reusing available components wherever possible.

**Workflow:** Upload PDF → Extract → Review/Correct → Approve/Reject → Save/Retrieve

## 2. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/uploads` | Upload PDF to Supabase Storage |
| POST | `/api/uploads/{id}/extract` | Extract invoice details |
| POST | `/api/invoices` | Save reviewed invoice and decision |
| GET | `/api/invoices/{id}` | Retrieve saved invoice |

## 3. API Conventions

- **Format:** JSON; `multipart/form-data` for uploads
- **Authentication:** Existing application authentication
- **Identifiers:** UUID
- **Dates:** `YYYY-MM-DD`
- **Success responses:** `200 OK`, `201 Created`
- **Error responses:** Standard HTTP status codes with consistent JSON error objects

## 4. Request and Response Formats

### Upload Invoice

`POST /api/uploads`

**Request:** PDF file using `multipart/form-data`.

**Response: 201 Created**

```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_path": "invoices/550e8400-e29b-41d4-a716-446655440000/invoice.pdf"
}
```

### Extract Invoice Details

`POST /api/uploads/{id}/extract`

**Request:** Upload ID in the URL. No request body.

**Response: 200 OK**

```json
{
  "vendor": "ABC Plumbing",
  "invoice_number": "INV-123",
  "amount": 425.00,
  "due_date": "2026-11-15"
}
```

Missing or uncertain values return `null` for manual correction.

### Save Reviewed Invoice

`POST /api/invoices`

**Request:**

```json
{
  "upload_id": "550e8400-e29b-41d4-a716-446655440000",
  "vendor": "ABC Plumbing",
  "invoice_number": "INV-123",
  "amount": 425.00,
  "due_date": "2026-11-15",
  "decision": "approved"
}
```

**Response: 201 Created**

```json
{
  "id": "a1b2c3d4-e5f6-4789-a123-b45678901234",
  "status": "approved"
}
```

The decision is submitted only after explicit human review. Both approved and rejected invoices are retained.

### Retrieve Invoice

`GET /api/invoices/{id}`

**Response: 200 OK**

```json
{
  "id": "a1b2c3d4-e5f6-4789-a123-b45678901234",
  "vendor": "ABC Plumbing",
  "invoice_number": "INV-123",
  "amount": 425.00,
  "due_date": "2026-11-15",
  "status": "approved"
}
```

## 5. Validation and Error Handling

- Accept one supported PDF per upload.
- Validate the four extracted invoice fields.
- Require human review before approval or rejection.
- Store corrected values rather than unverified extraction results.
- Preserve rejected invoices for later retrieval.
- Enforce authentication and authorization server-side.

**Standard error response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid or incomplete invoice data."
  }
}
```

Relevant status codes: `400`, `401`, `403`, `404`, `409`, `413`, `415`, `422`, `500`.

## 6. Integration Dependencies

**PDF Storage:** Supabase Storage is confirmed for original uploaded PDFs.

**Database:** Josh's current schema requires `date`, `reference_number`, `vendor_id`, `property_id`, and `amount`. The backend implementation must resolve these fields before persisting the invoice.

**PDF Reference:** The saved invoice must retain a reference to the original uploaded document.

**Authorization:** The API must enforce decision permissions consistently with the Supabase security policies.

**Implementation:** Next.js route handlers and direct Supabase operations can be used as appropriate, provided the agreed request and response contracts remain consistent.

## 7. Next Steps

Review the proposed interfaces with the frontend and backend teams, align the invoice data model under DC-15, and validate the complete workflow using one fictional invoice.

The priority is a working end-to-end implementation using the components and infrastructure already available.

---

*Draft for team review. Subject to the project's approved requirements and technical decisions.*