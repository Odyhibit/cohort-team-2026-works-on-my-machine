export type InvoiceDetails = {
  vendorName: string | null;
  propertyName: string | null;
  invoiceNumber: string | null;
  amountDue: string | null;
  dueDate: string | null;
  paymentUrl: string | null;
};

// Add new label spellings here as more invoice formats arrive.
const AMOUNT_DUE_LABELS = [
  /\b(?:total amount due|amount to pay|balance to remit|outstanding balance|net to remit|balance outstanding|balance due|still to pay|net payable|net amount payable|amount due|please pay)\s*:?\s*$/i,
];

const AMOUNT_FALLBACK_LABELS = [
  /\b(?:invoice total|bill total|current bill|invoice amount)\s*:?\s*$/i,
];

const DUE_DATE_LABELS = [
  /\b(?:due(?: date)?|payable by|pay by|payment deadline|payment requested by)\s*:?\s*$/i,
  /\bplease pay\s+\$[\d,]+(?:\.\d{2})?\s+by\s*$/i,
];

const INVOICE_NUMBER_PATTERNS = [
  /\bBILL-\d+(?:-[A-Z0-9]+)?\b/i,
  /\bINV[- ]\d+[A-Z0-9-]*\b/i,
  /\b[A-Z]{2,}-\d{3,}[A-Z0-9-]*\b/i,
];

const CUSTOMER_LABEL_LINES = [
  /^(?:\d+\.\s*)?(?:prepared for|bill(?:ed)? to|your account|customer(?:\s*\/\s*(?:business name|location))?)\s*:?$/i,
];

const CUSTOMER_INLINE_LABELS = [
  /^(?:customer|prepared for|bill(?:ed)? to)\s*:\s*(.+)$/i,
];

const ADDRESS_LINE = /^\d+\s+\S.*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?$/;

const HEADER_TITLES = [
  /^INVOICE$/i,
  /^RENT STATEMENT$/i,
  /^SERVICE INVOICE$/i,
  /^STATEMENT$/i,
];

const HEADER_SUFFIXES = [
  /\s+ACCOUNT RECONCILIATION$/i,
  /\s+INVOICE$/i,
  /\s+BILL-\d+(?:-[A-Z0-9]+)?\b.*$/i,
];

const MONTHS = new Map([
  ["jan", 1], ["feb", 2], ["mar", 3], ["apr", 4],
  ["may", 5], ["jun", 6], ["jul", 7], ["aug", 8],
  ["sep", 9], ["oct", 10], ["nov", 11], ["dec", 12],
]);

function precedingText(text: string, index: number, length = 100): string {
  return text.slice(Math.max(0, index - length), index).replace(/\s+/g, " ").trim();
}

function extractAmountDue(text: string): string | null {
  const amounts = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)];

  for (const labels of [AMOUNT_DUE_LABELS, AMOUNT_FALLBACK_LABELS]) {
    if (labels === AMOUNT_FALLBACK_LABELS && /\b(?:payments?|paid|credits?)\b/i.test(text)) break;

    for (const match of amounts) {
      const before = precedingText(text, match.index);
      if (!labels.some((label) => label.test(before))) continue;
      const value = match[1].replaceAll(",", "");
      if (!/^\d+(?:\.\d{2})?$/.test(value)) continue;
      return value.includes(".") ? value : `${value}.00`;
    }
  }

  return null;
}

function formatDate(monthName: string, dayText: string, yearText: string): string | null {
  const month = MONTHS.get(monthName.slice(0, 3).toLowerCase());
  if (!month) return null;
  const day = Number(dayText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function extractDueDate(text: string): string | null {
  const dates = text.matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2}),\s*(\d{4})\b/gi);
  for (const match of dates) {
    const before = precedingText(text, match.index);
    if (!DUE_DATE_LABELS.some((label) => label.test(before))) continue;
    const date = formatDate(match[1], match[2], match[3]);
    if (date) return date;
  }
  return null;
}

function extractInvoiceNumber(text: string): string | null {
  for (const pattern of INVOICE_NUMBER_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[0].replace(/\s+/, "-");
  }
  return null;
}

function extractPaymentUrl(text: string): string | null {
  const candidates = [...text.matchAll(/https?:\/\/[^\s<>"']+/gi)]
    .map((match) => ({ raw: match[0].replace(/[.,;:!?)]*$/, ""), index: match.index }));
  const urls = candidates.flatMap(({ raw, index }) => {
    try {
      const url = new URL(raw);
      return url.protocol === "https:" ? [{ url: url.toString(), index }] : [];
    } catch {
      return [];
    }
  });

  if (urls.length === 1) return urls[0].url;
  const paymentUrls = urls.filter(({ index }) =>
    /\b(?:pay|payment|remittance|settle|portal)\b/i.test(precedingText(text, index)),
  );
  return paymentUrls.length === 1 ? paymentUrls[0].url : null;
}

function extractVendorName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < Math.min(lines.length, 12); index++) {
    const line = lines[index];
    if (/^(?:DEMO DOCUMENT|Fictional bill)/i.test(line) || HEADER_TITLES.some((title) => title.test(line))) {
      continue;
    }
    let name = HEADER_SUFFIXES.reduce((value, suffix) => value.replace(suffix, ""), line).trim();
    if (!name || name.length > 70 || /^[\d$]/.test(name) || /^https?:/i.test(name)) continue;

    const next = lines[index + 1]?.trim() ?? "";
    if (/^[A-Z][a-z]+$/.test(next) && !HEADER_TITLES.some((title) => title.test(next))) {
      name += ` ${next}`;
    } else if (/^[A-Za-z]+$/.test(name) && /^[A-Z]+(?: [A-Z]+){1,2}$/.test(next)
      && !HEADER_TITLES.some((title) => title.test(next))) {
      name += ` ${next.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}`;
    }
    return name;
  }
  return null;
}

function isNameLike(value: string): boolean {
  return value.length > 0 && value.length <= 70 && !/^[\d$]/.test(value) && !/^https?:/i.test(value);
}

function extractPropertyName(text: string): string | null {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    for (const label of CUSTOMER_INLINE_LABELS) {
      const value = line.match(label)?.[1].trim();
      if (value && isNameLike(value)) return value;
    }
    if (CUSTOMER_LABEL_LINES.some((label) => label.test(line))) {
      const next = lines[index + 1] ?? "";
      if (isNameLike(next)) return next;
    }
  }

  const addressIndex = lines.findIndex((line) => ADDRESS_LINE.test(line));
  const beforeAddress = lines[addressIndex - 1] ?? "";
  if (addressIndex > 0 && isNameLike(beforeAddress) && beforeAddress !== beforeAddress.toUpperCase()) {
    return beforeAddress;
  }
  return null;
}

export function parseInvoice(text: string): InvoiceDetails {
  return {
    vendorName: extractVendorName(text),
    propertyName: extractPropertyName(text),
    invoiceNumber: extractInvoiceNumber(text),
    amountDue: extractAmountDue(text),
    dueDate: extractDueDate(text),
    paymentUrl: extractPaymentUrl(text),
  };
}
