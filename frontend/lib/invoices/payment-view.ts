import type { PaymentAttempt } from "./payment";

export type PaymentView = Pick<PaymentAttempt, "id" | "run_id" | "status" | "message" | "created_at"> & {
  suggested_confirmation: string | null;
};

export function paymentView(attempt: Pick<PaymentAttempt, "id" | "run_id" | "status" | "message" | "created_at" | "result">): PaymentView {
  let result = attempt.result;
  if (typeof result === "string") {
    try { result = JSON.parse(result); } catch { result = null; }
  }
  const raw = result && typeof result === "object" && !Array.isArray(result)
    && "confirmation_number" in result ? result.confirmation_number : null;
  const confirmation = typeof raw === "string" ? raw.trim() : "";
  return {
    id: attempt.id, run_id: attempt.run_id, status: attempt.status,
    message: attempt.message, created_at: attempt.created_at,
    suggested_confirmation: confirmation.length > 0 && confirmation.length <= 200 ? confirmation : null,
  };
}
