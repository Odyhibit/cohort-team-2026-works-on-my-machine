import { PDFParse } from "pdf-parse";
import { readFile } from "node:fs/promises";

async function main() {
  const filename = process.argv[2];

  if (!filename) {
    console.error("Usage: npx tsx test-extraction.ts <file.pdf>");
    process.exit(1);
  }

  const buffer = await readFile(filename);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    console.log(result.text);
  } finally {
    await parser.destroy();
  }
}

main().catch(console.error);