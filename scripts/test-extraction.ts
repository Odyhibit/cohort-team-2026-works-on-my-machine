import { readFile } from "node:fs/promises";
import { extractInvoiceFromPdf } from "../frontend/app/invoices/upload/extract-invoice";

async function run() {
  const filename = process.argv[2];

  if (!filename) {
    console.error("Usage: npx tsx test-extraction.ts <file.pdf>");
    process.exit(1);
  }

  const buffer = await readFile(filename);
  console.log(JSON.stringify(await extractInvoiceFromPdf(buffer), null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
