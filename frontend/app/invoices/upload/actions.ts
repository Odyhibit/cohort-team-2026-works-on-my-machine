"use server";

import { refresh } from "next/cache";
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
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validatedInvoice(input: Omit<InvoiceInput, "date">): { error: string } | { values: {
  reference_number: string;
  vendor_id: string;
  property_id: string;
  amount: number;
  due_date: string;
  payment_url: string | null;
  status: InvoiceStatus;
} } {
  if (!input || typeof input.invoiceNumber !== "string" || typeof input.amountDue !== "string"
    || typeof input.vendorId !== "string" || typeof input.propertyId !== "string"
    || typeof input.dueDate !== "string" || typeof input.paymentUrl !== "string") {
    return { error: "Invalid invoice details." };
  }
  const invoiceNumber = input.invoiceNumber.trim();
  const paymentUrl = input.paymentUrl.trim();
  const amount = Number(input.amountDue);
  if (!uuid.test(input.vendorId) || !uuid.test(input.propertyId)) return { error: "Choose a vendor and a property." };
  if (!invoiceNumber) return { error: "Enter an invoice number." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };
  if (!isoDate.test(input.dueDate)) return { error: "Enter a due date." };
  if (paymentUrl && !isUrl(paymentUrl)) return { error: "Enter a valid payment URL." };
  if (!isInvoiceStatus(input.status)) return { error: "Choose a valid status." };

  return { values: {
    reference_number: invoiceNumber,
    vendor_id: input.vendorId,
    property_id: input.propertyId,
    amount,
    due_date: input.dueDate,
    payment_url: paymentUrl || null,
    status: input.status,
  } };
}

export async function createInvoice(input: InvoiceInput): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const validated = validatedInvoice(input);
  if ("error" in validated) return validated;
  if (typeof input.date !== "string" || !isoDate.test(input.date)) return { error: "Invalid invoice date." };

  const { error } = await supabase.from("invoices").insert({
    ...validated.values,
    date: input.date,
  });
  if (error) return { error: `Could not save invoice: ${error.message}` };
  refresh();
}

export async function updateInvoice(id: string, input: Omit<InvoiceInput, "date">): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");
  if (typeof id !== "string" || !uuid.test(id)) return { error: "Invalid invoice." };

  const validated = validatedInvoice(input);
  if ("error" in validated) return validated;

  const { error } = await supabase.from("invoices")
    .update(validated.values)
    .eq("id", id)
    .select("id")
    .single();
  if (error) return { error: `Could not save invoice: ${error.message}` };
  refresh();
}
