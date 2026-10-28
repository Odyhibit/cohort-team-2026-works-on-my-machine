import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { extractInvoiceFromPdf } from "./extract-invoice";

const examples = [
  ["alder-creek", "Alder Creek Landscaping", "Alder Creek Workshop", "186.42"],
  ["brightwater", "Brightwater Water & Sewer", "Brightwater Print Studio", "324.16"],
  ["cedar-valley", "Cedar Valley Pest Control", "Cedar Valley Market", "206.54"],
  ["copper-ridge", "Copper Ridge Waste Services", "Copper Ridge Fabrication", "518.70"],
  ["harborlight", "Harborlight Security", "Harborlight Design Co.", "392.08"],
  ["maple-junction", "Maple Junction Storage", "Maple Junction Books", "168.79"],
  ["northline", "Northline Business Internet", "Northline Logistics", "279.95"],
  ["prairie-grid", "Prairie Grid HVAC Services", "Prairie Grid Supply", "461.33"],
  ["summit-trail", "Summit Trail Equipment Rental", "Summit Trail Outfitters", "287.61"],
  ["sunmeadow", "Sunmeadow Cleaning", "Sunmeadow Bakery", "143.28"],
] as const;

for (const [filename, vendorName, propertyName, amountDue] of examples) {
  test(`${filename} invoice`, async () => {
    const data = await readFile(join(__dirname, "__fixtures__", `${filename}-bill.pdf`));
    assert.deepEqual(await extractInvoiceFromPdf(data), {
      vendorName,
      propertyName,
      invoiceNumber: "BILL-1001",
      amountDue,
      dueDate: "2026-10-16",
      paymentUrl: `https://${filename}-utility-demo.vercel.app/`,
    });
  });
}
