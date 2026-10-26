import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { parseInvoice } from "../../../../../scripts/invoice-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No PDF file provided." },
        { status: 400 }
      );
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Only PDF files are supported." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      const invoice = parseInvoice(result.text);

      return NextResponse.json(invoice);
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error("Invoice extraction failed:", error);

    return NextResponse.json(
      { error: "Failed to extract invoice details." },
      { status: 500 }
    );
  }
}