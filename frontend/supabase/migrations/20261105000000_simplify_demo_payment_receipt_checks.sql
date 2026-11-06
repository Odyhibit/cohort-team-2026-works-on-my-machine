begin;

-- Demo settlement requires a successful result, confirmation, and exact amount.
-- Retain other receipt fields for reference without requiring them to be shown.
-- Replace the private implementation shared by authenticated/background wrappers.
create or replace function public.finish_invoice_payment_result(p_attempt_id uuid, p_status text, p_result jsonb, p_message text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  attempt public.invoice_payment_attempts%rowtype;
  bill_id uuid;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  if p_status is null or p_status not in ('succeeded', 'failed', 'uncertain') then raise exception 'Invalid payment outcome'; end if;
  select invoice_id into bill_id from public.invoice_payment_attempts where id = p_attempt_id;
  perform 1 from public.invoices where id = bill_id for update;
  select * into attempt from public.invoice_payment_attempts where id = p_attempt_id for update;
  if not found then raise exception 'Payment attempt not found'; end if;
  if attempt.status in ('succeeded', 'failed') then return; end if;
  if p_status = 'succeeded' then
    if p_result is null or not coalesce(
      p_result ->> 'outcome' = 'succeeded'
      and jsonb_typeof(p_result -> 'confirmation_number') = 'string'
      and length(btrim(p_result ->> 'confirmation_number')) between 1 and 200
      and jsonb_typeof(p_result -> 'amount') = 'string'
      and p_result ->> 'amount' ~ '^\d{1,10}(\.\d{1,2})?$', false
    ) then raise exception 'Payment requires a successful result, confirmation number and valid amount'; end if;
    if (p_result ->> 'amount')::numeric <> (attempt.expected ->> 'amount')::numeric then
      raise exception 'Payment amount does not match the invoice';
    end if;
  end if;
  update public.invoice_payment_attempts set status = p_status, result = p_result,
    message = left(coalesce(p_message, ''), 1000), updated_at = clock_timestamp() where id = attempt.id;
  if p_status = 'succeeded' then
    perform public.save_invoice_payment_confirmation(attempt.invoice_id, p_result ->> 'confirmation_number');
  end if;
end;
$$;

-- Preserve the existing wrapper-only access to this implementation.
revoke all on function public.finish_invoice_payment_result(uuid, text, jsonb, text) from public, anon, authenticated;

commit;
