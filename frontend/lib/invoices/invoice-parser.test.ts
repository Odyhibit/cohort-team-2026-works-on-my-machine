import assert from "node:assert/strict";
import test from "node:test";
import { parseInvoice } from "./invoice-parser";

// Real extracted PDF text from the vendor demo sites (long boilerplate trimmed).
const harborlightText = "DEMO DOCUMENT - NO REAL PAYMENT REQUIRED\nProperty PROP-001 | Whole property | Service account LEGACY-harborlight | Billed-to LEGACY-PARTY-harborlight\nHarborlight Security ACCOUNT RECONCILIATION\nClient 2000456706 Document BILL-8E572D6D November 8, 2026\nCUSTOMER / LOCATION\nHarborlight Design Co.\n125 Industrial Way, Springfield, IL 62701\nThis advice reconciles the assessed charge and payment entries for the document identified above. Amount assessed is the original\nbill value; it is not necessarily the balance still payable. Refer to NET TO REMIT after taking into account the receipts applied.\nSERVICE BASIS\nMonthly business alarm monitoring\nENTRY DETAIL VALUE\n01 Amount assessed $399.92\n02 Receipts applied $0.00\n03 Net to remit $399.92\nPAYMENT DEADLINE November 22, 2026\nPosting status: UNPAID\nDocument settlement portal\nhttps://harborlight-utility-demo.vercel.app\nSign in; reference BILL-8E572D6D. Demo card or one-time ACH.\n\n-- 1 of 1 --\n\n";

const mapleJunctionText = "DEMO DOCUMENT - NO REAL PAYMENT REQUIRED\nProperty PROP-001 | Whole property | Service account LEGACY-maple-junction | Billed-to LEGACY-PARTY-maple-junction\nRENT STATEMENT\nMaple Junction Storage BILL-6AE708C7\nBILLED TO\nMaple Junction Books\n125 Industrial Way, Springfield, IL 62701\nRental account: 2000456708\nStatement prepared\nNovember 8, 2026\nPayment requested by\nNovember 22, 2026\nRENTAL CHARGE\nMonthly commercial storage unit rental $172.17\nCurrent bill $172.17\nPayments credited $0.00\nBalance outstanding $172.17\nUNPAID\nFor your records: this statement covers the single rental charge above. Keep the bill reference with your payment\nconfirmation. Download an updated statement after payment to confirm the balance.\nMake a rental payment\nhttps://maple-junction-utility-demo.vercel.app\nSign in; reference BILL-6AE708C7. Demo card or one-time ACH.\n\n-- 1 of 1 --\n\n";

test("parses an alphanumeric hex bill number and ignores the PROP-001 header", () => {
  assert.deepEqual(parseInvoice(harborlightText), {
    vendorName: "Harborlight Security",
    propertyName: "Harborlight Design Co.",
    invoiceNumber: "BILL-8E572D6D",
    amountDue: "399.92",
    dueDate: "2026-11-22",
    paymentUrl: "https://harborlight-utility-demo.vercel.app/",
  });
});

test("strips an alphanumeric bill id from the vendor line", () => {
  assert.deepEqual(parseInvoice(mapleJunctionText), {
    vendorName: "Maple Junction Storage",
    propertyName: "Maple Junction Books",
    invoiceNumber: "BILL-6AE708C7",
    amountDue: "172.17",
    dueDate: "2026-11-22",
    paymentUrl: "https://maple-junction-utility-demo.vercel.app/",
  });
});

test("does not treat Bill-to as a bill number", () => {
  const text = "Property PROP-001\nBill-to Example Co\nInvoice BILL-1001\n";
  assert.equal(parseInvoice(text).invoiceNumber, "BILL-1001");
});
