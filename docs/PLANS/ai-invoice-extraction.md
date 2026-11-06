# AI invoice extraction fallback

Status: Implemented; API configuration and a live scanned-document check pending.

## Files

- `frontend/app/api/invoices/extract/route.ts`: authenticated, size/signature-checked PDF/image intake.
- `frontend/lib/invoices/extraction.ts`: validates field values and coordinates parser → AI fallback.
- `frontend/lib/invoices/ai-extraction.ts`: server-only Gemini document request and structured JSON response.
- `frontend/app/invoices/InvoiceForm.client.tsx`: shared form and preview; complete parser or AI results automatically enter the existing save/rules/payment flow.
- `frontend/lib/invoices/extraction.test.ts`: fallback, validation and failure behavior.

## Behavior

1. Selecting a new invoice PDF attempts the existing text parser. Images go directly to the AI reader.
2. Required extraction fields are vendor name, property/customer name, invoice number, positive amount and valid due date. Payment URL remains optional, matching the form.
3. Complete text-parser results retain the existing automatic intake behavior. Incomplete text results or PDF parsing failures send the original document to Gemini when configured.
4. AI returns six nullable string fields using a JSON schema. Unknown or ambiguous values should be null. Document contents are data, not instructions; the request has no tools or browser/payment access.
5. Validate both parser and AI output. Fill missing parser fields from AI, preserving already valid parser values. Complete combined results allow automatic intake; missing or invalid required fields stay in the form for correction. Existing exact, unique name matching selects vendor/property IDs; unmatched names require a manual selection or resource creation. The create action validates active resource IDs independently.
6. When required fields are complete and vendor/property names each match one active record, the form automatically saves the document and invoice through the existing create action. Duplicate checks and approval rules still run. Only approved invoices with vendor autopay enabled start the existing Browser Use payment workflow; confirmed matching receipts mark them paid. The extraction API itself writes no invoice and starts no payment. Missing or ambiguous resource matches require a manual selection.
7. Missing configuration, provider failure, unreadable data, or malformed output leaves partial parser details available for manual entry. Fixed messages distinguish rejected API keys, permission errors, unavailable models, quota/rate limits and timeouts. Logs contain only a fixed error category; raw provider errors, keys and document contents are not exposed.

## Deployment

No migration or additional npm package is needed. Add the following server-only variables to `frontend/.env.local` and the relevant Vercel environment, then restart/redeploy:

```dotenv
GEMINI_API_KEY=your-google-ai-studio-api-key
GEMINI_EXTRACTION_MODEL=gemini-3.5-flash-lite
```

The model setting is optional; the code defaults to `gemini-3.5-flash-lite`. This model is optimized for document parsing and simple extraction; see [Google's model documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite). The existing Browser Use key remains separate. Only incomplete PDFs and images make an AI request. The original document is sent inline to Google's API; there is no separate provider file upload to clean up. Gemini 3 models use LOW thinking for this bounded extraction task; other model families retain their supported defaults. Requests time out after 120 seconds and the extraction route has a 180-second execution budget. Enable Fluid compute in Vercel to support this duration on Hobby. Files retain the existing 4 MB limit.

Implementation references: [Gemini structured output](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) and [document processing](https://ai.google.dev/gemini-api/docs/generate-content/document-processing).

## Validation

- [x] Complete PDFs skip AI; missing optional URLs do not trigger paid requests.
- [x] Partial PDFs, empty text layers and parser errors use the fallback.
- [x] PNG/JPEG/WebP/GIF images bypass PDF text parsing.
- [x] Invalid dates, amounts, field types and payment URLs are discarded.
- [x] Missing keys and failed requests preserve partial data for manual correction.
- [x] Live Gemini Flash-Lite request read all six fields from the fictional Alder Creek PDF correctly in about one second. The previous Gemini 3.8 request returned a temporary-unavailable error after 85 seconds.
- [x] Complete AI results permit automatic intake; missing/invalid required fields and provider failures require correction.
- [ ] Upload an image-only PDF and a scanned image through the UI; verify automatic save, rules, and eligible demo payment completion.

## Decisions and scope

Gemini is the initial provider; model selection is configurable. Complete validated AI results use the same automatic save path as complete text-parser results. Account-number matching, multiple invoices per document, and changes to approval rules remain outside this increment.
