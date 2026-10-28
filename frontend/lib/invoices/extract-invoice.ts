import { parseInvoice } from "./invoice-parser";

export async function extractInvoiceFromPdf(data: Uint8Array) {
  await import("pdf-parse/worker");
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return parseInvoice(result.text);
  } finally {
    await parser.destroy();
  }
}
