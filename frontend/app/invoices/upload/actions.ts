"use server";

import { createClient } from "@/utils/supabase/server";
import { isInvoiceStatus, type InvoiceStatus } from "@/lib/invoices/status";

export type InvoiceInput = {
  date: string;
  vendorId: string;
  propertyId: string;
  invoiceNumber: string;
  amountDue: string;
  dueDate: string;
  paymentUrl: string;
  status: InvoiceStatus;
};

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export async function createInvoice(input: InvoiceInput): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const invoiceNumber = input.invoiceNumber.trim();
  const paymentUrl = input.paymentUrl.trim();
  const amount = Number(input.amountDue);
  if (!input.vendorId || !input.propertyId) return { error: "Choose a vendor and a property." };
  if (!invoiceNumber) return { error: "Enter an invoice number." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };
  if (!isoDate.test(input.dueDate)) return { error: "Enter a due date." };
  if (!isoDate.test(input.date)) return { error: "Invalid invoice date." };
  if (paymentUrl && !isUrl(paymentUrl)) return { error: "Enter a valid payment URL." };
  if (!isInvoiceStatus(input.status)) return { error: "Choose a valid status." };

  const { error } = await supabase.from("invoices").insert({
    date: input.date,
    reference_number: invoiceNumber,
    vendor_id: input.vendorId,
    property_id: input.propertyId,
    amount,
    due_date: input.dueDate,
    payment_url: paymentUrl || null,
    status: input.status,
  });
  if (error) return { error: `Could not save invoice: ${error.message}` };
}
