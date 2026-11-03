"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import type { InvoiceStatus } from "@/lib/invoices/status";

const duplicateInvoiceIndex = "invoices_vendor_property_reference_unique_idx";

function invoiceSaveError(error: { code?: string; message: string }) {
  if (error.code === "23505" && error.message.includes(duplicateInvoiceIndex)) {
    return "An invoice with this reference number, vendor, and property already exists (including archived invoices).";
  }
  return `Could not save invoice: ${error.message}`;
}

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

function validatedInvoice(input: Omit<InvoiceInput, "date" | "status">): { error: string } | { values: {
  reference_number: string;
  vendor_id: string;
  property_id: string;
  amount: number;
  due_date: string;
  payment_url: string | null;
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
  return { values: {
    reference_number: invoiceNumber,
    vendor_id: input.vendorId,
    property_id: input.propertyId,
    amount,
    due_date: input.dueDate,
    payment_url: paymentUrl || null,
  } };
}

async function activeReferences(supabase: Awaited<ReturnType<typeof createClient>>, vendorId: string, propertyId: string) {
  return Promise.all([
    supabase.from("vendors").select("id").eq("id", vendorId).is("deleted_at", null).maybeSingle(),
    supabase.from("properties").select("id").eq("id", propertyId).is("deleted_at", null).maybeSingle(),
  ]);
}

export type CreatedInvoice = { id: string; status: "approved" | "waiting on approval"; reasons: string[] };

export async function createInvoice(input: Omit<InvoiceInput, "status">): Promise<{ error: string } | CreatedInvoice> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const validated = validatedInvoice(input);
  if ("error" in validated) return validated;
  if (typeof input.date !== "string" || !isoDate.test(input.date)) return { error: "Invalid invoice date." };

  const { data: created, error } = await supabase.rpc("create_invoice_with_rules", {
    p_date: input.date,
    p_reference_number: validated.values.reference_number,
    p_vendor_id: validated.values.vendor_id,
    p_property_id: validated.values.property_id,
    p_amount: validated.values.amount,
    p_due_date: validated.values.due_date,
    p_payment_url: validated.values.payment_url,
  });
  if (error) return { error: invoiceSaveError(error) };
  const result = created as CreatedInvoice | null;
  if (!result?.id || !result.status || !Array.isArray(result.reasons)) {
    return { error: "Invoice was saved, but its approval result could not be read. Check the invoice list before trying again." };
  }
  revalidatePath("/invoices");
  revalidatePath("/");
  revalidatePath("/events");
  refresh();
  return result;
}

export async function updateInvoice(id: string, input: Omit<InvoiceInput, "date" | "status">): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");
  if (typeof id !== "string" || !uuid.test(id)) return { error: "Invalid invoice." };

  const validated = validatedInvoice(input);
  if ("error" in validated) return validated;

  const { data: current, error: currentError } = await supabase.from("invoices")
    .select("vendor_id, property_id, status")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (currentError) return { error: currentError.message };
  if (!current) return { error: "Invoice not found or archived." };
  if (current.status === "approved" || current.status === "paid") return { error: "Approved and paid invoices cannot be edited." };

  const [vendor, property] = await activeReferences(supabase, validated.values.vendor_id, validated.values.property_id);
  if (vendor.error) return { error: vendor.error.message };
  if (property.error) return { error: property.error.message };
  if (!vendor.data && validated.values.vendor_id !== current.vendor_id) return { error: "Choose an active vendor." };
  if (!property.data && validated.values.property_id !== current.property_id) return { error: "Choose an active property." };

  const { error } = await supabase.from("invoices")
    .update(validated.values)
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();
  if (error) return { error: invoiceSaveError(error) };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}/edit`);
  revalidatePath("/");
  revalidatePath("/events");
  refresh();
}

export async function approveInvoice(id: string): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");
  if (!uuid.test(id)) return { error: "Invalid invoice." };

  const { error } = await supabase.rpc("approve_invoice_manually", { p_invoice_id: id });
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}/edit`);
  revalidatePath("/");
  revalidatePath("/events");
  refresh();
}

export async function archiveInvoice(_prev: { error: string } | undefined, formData: FormData): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "");
  if (!uuid.test(id)) return { error: "Invalid invoice." };

  const { error } = await supabase.from("invoices")
    .update({ deleted_at: new Date().toISOString(), deleted_by: data.claims.sub })
    .eq("id", id)
    .is("deleted_at", null)
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}/edit`);
  revalidatePath("/");
  revalidatePath("/events");
  refresh();
  redirect("/invoices");
}
