import { PDFParse } from "pdf-parse";
import { parseInvoice } from "./invoice-parser";

export async function extractInvoiceFromPdf(data: Uint8Array) {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return parseInvoice(result.text);
  } finally {
    await parser.destroy();
  }
}
