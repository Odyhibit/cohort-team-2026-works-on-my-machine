-- FICTIONAL DEMO DATA ONLY. Run this ENTIRE file in the Supabase SQL Editor
-- as the database owner (postgres), after applying the application migrations
-- through 20261104020000_allow_replacing_archived_invoices.sql.
-- This is repeatable demo maintenance, deliberately NOT a migration.
--
-- Archives nonarchived BILL-1001 invoices for the ten exact vendor/property/
-- account combinations from demo-invoice-history.sql and the original PDFs.
-- Dates and amounts are not filters: modified copies may still reserve the
-- original number. No vendors, properties, synthetic DEMO-HIST-* invoices,
-- other invoice numbers, or already archived records are changed.
--
-- Preserves invoice status, reference, confirmation, documents, payment
-- attempts, rule evaluations, and existing audit history. A new System archive
-- event explains the reset. Paid samples are archived by temporarily disabling
-- ONLY the paid-row guard; it is reenabled before commit. Other guards and
-- audit triggers stay enabled. Normal app permissions/paid locks are unchanged.
--
-- First finish or resolve any starting/running/uncertain payment attempts on
-- these samples. The script refuses unresolved attempts, including on an
-- invoice whose status no longer reflects the attempt. It cannot stop a remote
-- Browser Use job or reset payment history on the vendor websites. The agent
-- may retrieve an existing receipt there instead of performing a new checkout.
--
-- The invoice table is locked briefly for the reset. Run while teammates are
-- not entering invoices. On an error, run ROLLBACK; before retrying. Nothing
-- commits unless the whole transaction succeeds; trigger changes roll back too.

begin;

-- Share the history seed's lock so resource/history setup cannot interleave.
select pg_advisory_xact_lock(2026, 110201);
lock table public.invoices in access exclusive mode;
lock table public.invoice_payment_attempts in share row exclusive mode;

create temporary table demo_invoice_reset_sources (
  vendor_name text not null,
  property_name text not null,
  account_number text not null,
  primary key (vendor_name, property_name)
) on commit drop;

insert into demo_invoice_reset_sources (vendor_name, property_name, account_number) values
  ('Alder Creek Landscaping', 'Alder Creek Workshop', '2000456700'),
  ('Brightwater Water & Sewer', 'Brightwater Print Studio', '2000456701'),
  ('Cedar Valley Pest Control', 'Cedar Valley Market', '2000456705'),
  ('Copper Ridge Waste Services', 'Copper Ridge Fabrication', '2000456702'),
  ('Harborlight Security', 'Harborlight Design Co.', '2000456706'),
  ('Maple Junction Storage', 'Maple Junction Books', '2000456708'),
  ('Northline Business Internet', 'Northline Logistics', '2000456703'),
  ('Prairie Grid HVAC Services', 'Prairie Grid Supply', '2000456707'),
  ('Summit Trail Equipment Rental', 'Summit Trail Outfitters', '2000456709'),
  ('Sunmeadow Cleaning', 'Sunmeadow Bakery', '2000456704');

do $$
declare
  conflict record;
begin
  if not exists (
    select 1 from pg_index
    where indexrelid = to_regclass('public.invoices_vendor_property_reference_unique_idx')
      and indisunique
      and pg_get_expr(indpred, indrelid) = '(deleted_at IS NULL)'
  ) then
    raise exception 'Apply 20261104020000_allow_replacing_archived_invoices.sql first; archived invoices must not reserve their reference numbers';
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.invoices'::regclass
      and tgname = 'protect_paid_invoices' and tgenabled = 'O'
  ) then
    raise exception 'The protect_paid_invoices trigger must be enabled before running this reset';
  end if;

  -- Fail explicitly on a changed/missing account, rather than quietly leaving
  -- a known sample active and still blocking its next upload.
  select i.id, v.name as vendor_name, v.account_number, s.account_number as expected_account
  into conflict
  from public.invoices i
  join public.vendors v on v.id = i.vendor_id
  join public.properties p on p.id = i.property_id
  join demo_invoice_reset_sources s
    on lower(btrim(v.name)) = lower(btrim(s.vendor_name))
    and lower(btrim(p.name)) = lower(btrim(s.property_name))
  where i.deleted_at is null and lower(btrim(i.reference_number)) = 'bill-1001'
    and btrim(coalesce(v.account_number, '')) <> s.account_number
  order by i.id limit 1;
  if found then
    raise exception 'Invoice % for vendor % has account %, expected %. No samples were archived.',
      conflict.id, conflict.vendor_name, coalesce(conflict.account_number, '(missing)'), conflict.expected_account;
  end if;
end;
$$;

create temporary table demo_invoice_reset_targets on commit drop as
select i.id, v.name as vendor_name, p.name as property_name,
  i.reference_number, i.status, i.amount, i.payment_confirmation_number
from public.invoices i
join public.vendors v on v.id = i.vendor_id
join public.properties p on p.id = i.property_id
join demo_invoice_reset_sources s
  on lower(btrim(v.name)) = lower(btrim(s.vendor_name))
  and lower(btrim(p.name)) = lower(btrim(s.property_name))
  and btrim(v.account_number) = s.account_number
where i.deleted_at is null and lower(btrim(i.reference_number)) = 'bill-1001';

do $$
declare
  pending record;
begin
  select a.invoice_id, a.run_id, a.status into pending
  from public.invoice_payment_attempts a
  join demo_invoice_reset_targets t on t.id = a.invoice_id
  where a.status in ('starting', 'running', 'uncertain')
  order by a.created_at, a.id limit 1;
  if found then
    raise exception 'Invoice % has an unresolved % payment attempt (Browser Use task: %). Finish or resolve it in the app before resetting. No samples were archived.',
      pending.invoice_id, pending.status, coalesce(pending.run_id::text, 'no task ID saved');
  end if;
end;
$$;

alter table public.invoices disable trigger protect_paid_invoices;

update public.invoices i
set deleted_at = transaction_timestamp(), deleted_by = null
from demo_invoice_reset_targets t
where i.id = t.id and i.deleted_at is null;

alter table public.invoices enable trigger protect_paid_invoices;

-- Annotate only the archive events created by this transaction. The row
-- trigger supplies System attribution for SQL Editor operations automatically.
update public.audit_events e
set reason = 'Demo reset: archived the original BILL-1001 sample to allow another upload.'
from demo_invoice_reset_targets t
where e.invoice_id = t.id and e.action = 'archived'
  and (e.changes -> 'deleted_at' ->> 'new')::timestamptz = transaction_timestamp();

-- The result lists exactly what was archived. Zero rows means no matching
-- active samples were present; rerunning does not add duplicate archive events.
select t.id as invoice_id, t.vendor_name, t.property_name,
  t.reference_number, t.status as preserved_status, t.amount,
  t.payment_confirmation_number as preserved_confirmation, i.deleted_at as archived_at
from demo_invoice_reset_targets t
join public.invoices i on i.id = t.id
order by t.vendor_name, t.property_name, t.id;

commit;
