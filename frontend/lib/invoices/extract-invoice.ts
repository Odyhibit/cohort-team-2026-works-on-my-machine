import { parseInvoice } from "./invoice-parser";

export async function extractInvoiceFromPdf(data: Uint8Array) {
  await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  // pdf.js takes ownership of (detaches) the buffer it is given. Parse a copy so the
  // caller can still send the original bytes to the AI fallback.
  const parser = new PDFParse({ data: data.slice() });
  try {
    const result = await parser.getText();
    return parseInvoice(result.text);
  } finally {
    await parser.destroy();
  }
}
