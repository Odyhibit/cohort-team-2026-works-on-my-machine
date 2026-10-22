import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { PDFParse } from "pdf-parse";
import { parseInvoice } from "./invoice-parser";

const examples = [
  ["alder-creek", "Alder Creek Landscaping", "186.42"],
  ["brightwater", "Brightwater Water & Sewer", "324.16"],
  ["cedar-valley", "Cedar Valley Pest Control", "206.54"],
  ["copper-ridge", "Copper Ridge Waste Services", "518.70"],
  ["harborlight", "Harborlight Security", "392.08"],
  ["maple-junction", "Maple Junction Storage", "168.79"],
  ["northline", "Northline Business Internet", "279.95"],
  ["prairie-grid", "Prairie Grid HVAC Services", "461.33"],
  ["summit-trail", "Summit Trail Equipment Rental", "287.61"],
  ["sunmeadow", "Sunmeadow Cleaning", "143.28"],
] as const;

for (const [filename, vendorName, amountDue] of examples) {
  test(`${filename} invoice`, async () => {
    const data = await readFile(join(__dirname, `${filename}-bill.pdf`));
    const parser = new PDFParse({ data });
    const { text } = await parser.getText();

    assert.deepEqual(parseInvoice(text), {
      vendorName,
      invoiceNumber: "BILL-1001",
      amountDue,
      dueDate: "2026-10-16",
      paymentUrl: `https://${filename}-utility-demo.vercel.app/`,
    });
  });
}
