import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";
import { parseInvoice } from "../frontend/lib/invoice-parser";

async function run() {
  const filename = process.argv[2];

  if (!filename) {
    console.error("Usage: npx tsx test-extraction.ts <file.pdf>");
    process.exit(1);
  }

  const buffer = await readFile(filename);
  const parser = new PDFParse({ data: buffer });

  const result = await parser.getText();
  console.log(JSON.stringify(parseInvoice(result.text), null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
