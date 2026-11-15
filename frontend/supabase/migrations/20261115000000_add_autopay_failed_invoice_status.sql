begin;

alter table public.invoices drop constraint invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('created', 'waiting on approval', 'approved', 'payment processing', 'autopay failed', 'paid'));

-- A failed payment does not revoke approval: preserve the approved field lock,
-- allow manual payment, and require reopening before correcting invoice details.
create or replace function app_private.protect_approved_invoice_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status in ('approved', 'payment processing', 'autopay failed', 'paid') and (
    new.date, new.reference_number, new.vendor_id, new.property_id,
    new.amount, new.due_date, new.payment_url
  ) is distinct from (
    old.date, old.reference_number, old.vendor_id, old.property_id,
    old.amount, old.due_date, old.payment_url
  ) then
    raise exception 'An approved, processing, autopay failed, or paid invoice cannot be edited without reopening it';
  end if;
  return new;
end;
$$;

revoke all on function app_private.protect_approved_invoice_fields() from public, anon, authenticated;

create or replace function public.save_invoice_payment_confirmation(p_invoice_id uuid, p_confirmation text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  invoice public.invoices%rowtype;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  if p_confirmation is null or length(btrim(p_confirmation)) not between 1 and 200 then
    raise exception 'Enter a confirmation number of up to 200 characters';
  end if;
  select * into invoice from public.invoices
  where id = p_invoice_id and deleted_at is null for update;
  if not found then raise exception 'Invoice not found'; end if;
  -- A retry after a lost response succeeds without modifying the paid record.
  if invoice.status = 'paid' and invoice.payment_confirmation_number = btrim(p_confirmation) then return; end if;
  if invoice.status not in ('approved', 'payment processing', 'autopay failed') then raise exception 'Only approved, processing or autopay failed invoices can be marked paid'; end if;
  update public.invoices set payment_confirmation_number = btrim(p_confirmation), status = 'paid'
  where id = p_invoice_id;
end;
$$;
revoke all on function public.save_invoice_payment_confirmation(uuid, text) from public, anon, authenticated;
grant execute on function public.save_invoice_payment_confirmation(uuid, text) to authenticated;

create or replace function public.reopen_invoice_for_correction(p_invoice_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  current_invoice public.invoices%rowtype;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'Enter a reason of up to 500 characters';
  end if;
  select * into current_invoice from public.invoices
  where id = p_invoice_id and deleted_at is null for update;
  if not found or current_invoice.status not in ('approved', 'autopay failed') then
    raise exception 'Only approved or autopay failed invoices can be reopened';
  end if;
  if nullif(btrim(current_invoice.payment_confirmation_number), '') is not null then
    raise exception 'An invoice with a payment confirmation cannot be reopened';
  end if;
  update public.invoices set status = 'waiting on approval' where id = p_invoice_id;

  -- The existing row trigger created this status event in the same transaction.
  -- The invoice lock prevents another transition from interleaving here.
  update public.audit_events set reason = btrim(p_reason)
  where id = (
    select id from public.audit_events
    where invoice_id = p_invoice_id and action = 'updated'
      and actor_user_id = auth.uid()
      and changes -> 'status' ->> 'old' = current_invoice.status
      and changes -> 'status' ->> 'new' = 'waiting on approval'
    order by occurred_at desc, id desc limit 1
  );
  if not found then raise exception 'Could not record the reopening reason'; end if;
end;
$$;
revoke all on function public.reopen_invoice_for_correction(uuid, text) from public, anon, authenticated;
grant execute on function public.reopen_invoice_for_correction(uuid, text) to authenticated;

-- Called after the payment attempt is settled, so the pending-payment guard
-- continues to block changes for running or uncertain payments.
-- Eligibility checks and failures opening a payment page are not payment failures.
create function public.record_invoice_autopay_failure(p_invoice_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  current_invoice public.invoices%rowtype;
begin
  if p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'Enter a failure reason of up to 500 characters';
  end if;
  select * into current_invoice from public.invoices
  where id = p_invoice_id and deleted_at is null for update;
  if not found then raise exception 'Invoice not found'; end if;
  -- Duplicate delivery succeeds without writing duplicate audit events.
  if current_invoice.status = 'autopay failed' then return; end if;
  if current_invoice.status not in ('approved', 'payment processing') then
    raise exception 'Only approved or processing invoices can have an autopay failure recorded';
  end if;
  if nullif(btrim(current_invoice.payment_confirmation_number), '') is not null then
    raise exception 'An invoice with a payment confirmation cannot have an autopay failure recorded';
  end if;
  update public.invoices set status = 'autopay failed' where id = p_invoice_id;
  update public.audit_events set reason = btrim(p_reason)
  where id = (
    select id from public.audit_events
    where invoice_id = p_invoice_id and action = 'updated'
      and changes -> 'status' ->> 'old' = current_invoice.status
      and changes -> 'status' ->> 'new' = 'autopay failed'
    order by occurred_at desc, id desc limit 1
  );
  if not found then raise exception 'Could not record the autopay failure reason'; end if;
end;
$$;
revoke all on function public.record_invoice_autopay_failure(uuid, text) from public, anon, authenticated;
grant execute on function public.record_invoice_autopay_failure(uuid, text) to service_role;

create or replace function public.begin_invoice_payment(p_invoice_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  bill public.invoices%rowtype;
  vendor public.vendors%rowtype;
  attempt public.invoice_payment_attempts%rowtype;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select * into bill from public.invoices where id = p_invoice_id and deleted_at is null for update;
  if not found or bill.status not in ('approved', 'payment processing', 'autopay failed') or nullif(btrim(bill.payment_confirmation_number), '') is not null then
    raise exception 'Only approved, unpaid invoices can start a payment';
  end if;
  select * into attempt from public.invoice_payment_attempts
    where invoice_id = bill.id and status <> 'failed' order by created_at desc limit 1;
  if found then return jsonb_build_object('claimed', false, 'attempt', to_jsonb(attempt)); end if;
  if bill.status not in ('approved', 'autopay failed') then raise exception 'Resolve the current payment before starting another'; end if;
  select * into vendor from public.vendors where id = bill.vendor_id and deleted_at is null for share;
  if not found or nullif(btrim(vendor.account_number), '') is null then
    raise exception 'An active vendor with an account number is required';
  end if;
  if bill.payment_url is null or bill.payment_url !~ '^https://(alder-creek|brightwater|cedar-valley|copper-ridge|harborlight|maple-junction|northline|prairie-grid|summit-trail|sunmeadow)-utility-demo\.vercel\.app([/?#]|$)' then
    raise exception 'Choose one of the configured demo payment websites';
  end if;
  -- Change status before inserting the reservation; the pending-payment trigger
  -- then protects all changes until settlement. Both writes commit together.
  update public.invoices set status = 'payment processing' where id = bill.id;
  insert into public.invoice_payment_attempts(invoice_id, actor_user_id, expected)
  values (bill.id, auth.uid(), jsonb_build_object(
    'payment_url', bill.payment_url, 'account_number', btrim(vendor.account_number),
    'invoice_number', bill.reference_number, 'amount', bill.amount::text, 'currency', 'USD'
  )) returning * into attempt;
  return jsonb_build_object('claimed', true, 'attempt', to_jsonb(attempt));
end;
$$;
-- Keep receipt validation and background settlement unchanged. Only a newly
-- settled failure changes the invoice; duplicate callbacks from an old failed
-- attempt must not overwrite a later retry's processing status.
create or replace function public.finish_invoice_payment(p_attempt_id uuid, p_status text, p_result jsonb, p_message text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  bill_id uuid;
  previous_status text;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select invoice_id into bill_id from public.invoice_payment_attempts where id = p_attempt_id;
  perform 1 from public.invoices where id = bill_id for update;
  select status into previous_status from public.invoice_payment_attempts where id = p_attempt_id for update;
  perform public.finish_invoice_payment_result(p_attempt_id, p_status, p_result, p_message);
  if previous_status in ('starting', 'running', 'uncertain') and exists (
    select 1 from public.invoice_payment_attempts where id = p_attempt_id and status = 'failed'
  ) then
    perform public.record_invoice_autopay_failure(bill_id,
      left(coalesce(nullif(btrim(p_message), ''), 'Automatic payment failed.'), 500));
  end if;
end;
$$;

create or replace function public.resolve_invoice_payment(p_attempt_id uuid, p_confirmation text, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
declare bill_id uuid;
begin
  if auth.uid() is null then raise exception 'Unauthorized'; end if;
  select invoice_id into bill_id from public.invoice_payment_attempts where id = p_attempt_id;
  perform 1 from public.invoices where id = bill_id for update;
  perform public.resolve_invoice_payment_result(p_attempt_id, p_confirmation, p_reason);
  if exists (select 1 from public.invoice_payment_attempts where id = p_attempt_id and status = 'failed') then
    perform public.record_invoice_autopay_failure(bill_id, btrim(p_reason));
  end if;
end;
$$;

revoke all on function public.begin_invoice_payment(uuid) from public, anon, authenticated;
revoke all on function public.finish_invoice_payment(uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.resolve_invoice_payment(uuid, text, text) from public, anon, authenticated;
grant execute on function public.begin_invoice_payment(uuid) to authenticated;
grant execute on function public.finish_invoice_payment(uuid, text, jsonb, text) to authenticated;
grant execute on function public.resolve_invoice_payment(uuid, text, text) to authenticated;

-- Reflect previously settled failures without changing paid, archived, pending,
-- uncertain, or successfully submitted payments. The existing audit trigger
-- records these status changes as system updates.
update public.invoices i set status = 'autopay failed'
where i.status = 'approved' and i.deleted_at is null
  and (select a.status from public.invoice_payment_attempts a
       where a.invoice_id = i.id order by a.created_at desc, a.id desc limit 1) = 'failed'
  and not exists (select 1 from public.invoice_payment_attempts a
                  where a.invoice_id = i.id and a.status <> 'failed')
  and nullif(btrim(i.payment_confirmation_number), '') is null;

commit;
