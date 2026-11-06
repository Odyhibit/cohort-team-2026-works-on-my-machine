import { createClient } from "@/utils/supabase/server";
import { extractInvoiceFromPdf } from "@/lib/invoices/extract-invoice";
import { documentFormat, maxDocumentBytes } from "@/lib/invoices/document";
import { extractWithFallback } from "@/lib/invoices/extraction";
import { aiExtractionConfigured, extractInvoiceWithAi } from "@/lib/invoices/ai-extraction";

// Leave time for auth, PDF parsing and the 120-second provider timeout.
// Vercel deployments need Fluid compute for this duration on the Hobby plan.
export const maxDuration = 180;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  if (authError || !data.user) {
    return Response.json({ error: "Sign in before extracting invoice details." }, { status: 401 });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an invoice PDF or image." }, { status: 400 });
  }
  if (file.size > maxDocumentBytes) {
    return Response.json({ error: "Choose a document smaller than 4 MB." }, { status: 413 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const format = documentFormat(bytes);
    if (!format) {
      return Response.json({ error: "Choose a PDF, PNG, JPEG, WebP, or GIF invoice." }, { status: 400 });
    }

    const result = await extractWithFallback(bytes, format.mime, {
      parsePdf: extractInvoiceFromPdf,
      readDocument: aiExtractionConfigured() ? extractInvoiceWithAi : undefined,
    });
    return Response.json(result);
  } catch (error) {
    console.error("Invoice document extraction failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: "Could not read this document. Enter the details manually." }, { status: 422 });
  }
}
