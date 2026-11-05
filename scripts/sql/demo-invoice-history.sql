-- FICTIONAL DEMO DATA ONLY. Run the entire file in the Supabase SQL Editor
-- as the database owner (postgres), after applying the application migrations
-- through invoice_documents_and_confirmation (payment_confirmation_number).
-- This is a manual seed, deliberately outside supabase/migrations.
--
-- Sources: the ten ../*-bill.pdf files. All are issued 2026-10-02, due
-- 2026-10-16, and use BILL-1001. That reference is reserved for future uploads.
-- This creates three PAID bills per vendor/property pair:
--   September: source amount -15%; August: +18%; July: -20%.
-- Both invoice and due dates are shifted by the same number of calendar months.
-- References include the vendor slug and month, e.g. DEMO-HIST-ALDER-CREEK-202609,
-- so every synthetic invoice has a distinct reference across all ten examples.
-- Account numbers, vendor/property names, service addresses, and payment URLs
-- match the PDFs. No PDF attachments or real payment transactions are created.
--
-- Existing active vendors/properties are reused by trimmed, case-insensitive
-- name. Missing ones are created. Matching vendor accounts are retained or
-- filled if blank; conflicting accounts and ambiguous names abort everything.
-- Vendor autopay is enabled so new uploads can exercise automatic approval.
-- Existing payment types and nonblank property addresses are preserved.
--
-- Reruns skip identical synthetic invoices, without updating immutable paid
-- rows. A conflicting/archived synthetic invoice aborts rather than hiding an
-- inconsistent history. No existing BILL-1001 invoices are modified or deleted.
-- Database audit triggers stay enabled; SQL Editor writes appear as System.

begin;

create temporary table demo_invoice_history_sources (
  source_file text primary key,
  slug text not null,
  vendor_name text not null,
  property_name text not null,
  account_number text not null,
  property_address text not null,
  source_date date not null,
  source_due_date date not null,
  source_amount numeric(12, 2) not null,
  payment_url text not null,
  vendor_id uuid,
  property_id uuid
) on commit drop;

insert into demo_invoice_history_sources (
  source_file, slug, vendor_name, property_name, account_number, property_address,
  source_date, source_due_date, source_amount, payment_url
) values
  ('alder-creek-bill.pdf', 'alder-creek', 'Alder Creek Landscaping', 'Alder Creek Workshop', '2000456700', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 186.42, 'https://alder-creek-utility-demo.vercel.app/'),
  ('brightwater-bill.pdf', 'brightwater', 'Brightwater Water & Sewer', 'Brightwater Print Studio', '2000456701', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 324.16, 'https://brightwater-utility-demo.vercel.app/'),
  ('cedar-valley-bill.pdf', 'cedar-valley', 'Cedar Valley Pest Control', 'Cedar Valley Market', '2000456705', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 206.54, 'https://cedar-valley-utility-demo.vercel.app/'),
  ('copper-ridge-bill.pdf', 'copper-ridge', 'Copper Ridge Waste Services', 'Copper Ridge Fabrication', '2000456702', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 518.70, 'https://copper-ridge-utility-demo.vercel.app/'),
  ('harborlight-bill.pdf', 'harborlight', 'Harborlight Security', 'Harborlight Design Co.', '2000456706', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 392.08, 'https://harborlight-utility-demo.vercel.app/'),
  ('maple-junction-bill.pdf', 'maple-junction', 'Maple Junction Storage', 'Maple Junction Books', '2000456708', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 168.79, 'https://maple-junction-utility-demo.vercel.app/'),
  ('northline-bill.pdf', 'northline', 'Northline Business Internet', 'Northline Logistics', '2000456703', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 279.95, 'https://northline-utility-demo.vercel.app/'),
  ('prairie-grid-bill.pdf', 'prairie-grid', 'Prairie Grid HVAC Services', 'Prairie Grid Supply', '2000456707', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 461.33, 'https://prairie-grid-utility-demo.vercel.app/'),
  ('summit-trail-bill.pdf', 'summit-trail', 'Summit Trail Equipment Rental', 'Summit Trail Outfitters', '2000456709', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 287.61, 'https://summit-trail-utility-demo.vercel.app/'),
  ('sunmeadow-bill.pdf', 'sunmeadow', 'Sunmeadow Cleaning', 'Sunmeadow Bakery', '2000456704', '125 Industrial Way, Springfield, IL 62701', '2026-10-02', '2026-10-16', 143.28, 'https://sunmeadow-utility-demo.vercel.app/')
;

do $$
declare
  source record;
  month record;
  matching_count integer;
  vendor_key uuid;
  property_key uuid;
  existing_account text;
  bill_date date;
  bill_due_date date;
  bill_amount numeric(12, 2);
  bill_reference text;
  confirmation text;
  saved_invoice public.invoices%rowtype;
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'invoices'
      and column_name = 'payment_confirmation_number'
  ) then
    raise exception 'Apply the invoice documents and confirmation migration before running this seed';
  end if;

  -- Serialize concurrent executions of this seed, including resource creation.
  perform pg_advisory_xact_lock(2026, 110201);

  for source in select * from demo_invoice_history_sources order by source_file loop
    vendor_key := null;
    property_key := null;
    select count(*) into matching_count from public.vendors
    where lower(btrim(name)) = lower(btrim(source.vendor_name)) and deleted_at is null;
    if matching_count > 1 then
      raise exception 'Multiple active vendors named %. Resolve duplicates before seeding.', source.vendor_name;
    elsif matching_count = 1 then
      select id, account_number into vendor_key, existing_account from public.vendors
      where lower(btrim(name)) = lower(btrim(source.vendor_name)) and deleted_at is null
      for update;
      if nullif(btrim(existing_account), '') is not null and btrim(existing_account) <> source.account_number then
        raise exception 'Vendor % has account %, but its PDF uses %. No data was changed.',
          source.vendor_name, existing_account, source.account_number;
      end if;
      update public.vendors set account_number = source.account_number, autopay = true
      where id = vendor_key and (account_number is distinct from source.account_number or not autopay);
    else
      if exists (select 1 from public.vendors
        where lower(btrim(name)) = lower(btrim(source.vendor_name)) and deleted_at is not null) then
        raise exception 'Vendor % is archived. Resolve it before seeding.', source.vendor_name;
      end if;
      insert into public.vendors (name, account_number, autopay)
      values (source.vendor_name, source.account_number, true) returning id into vendor_key;
    end if;

    select count(*) into matching_count from public.properties
    where lower(btrim(name)) = lower(btrim(source.property_name)) and deleted_at is null;
    if matching_count > 1 then
      raise exception 'Multiple active properties named %. Resolve duplicates before seeding.', source.property_name;
    elsif matching_count = 1 then
      select id into property_key from public.properties
      where lower(btrim(name)) = lower(btrim(source.property_name)) and deleted_at is null
      for update;
      update public.properties set address = source.property_address
      where id = property_key and nullif(btrim(address), '') is null;
    else
      if exists (select 1 from public.properties
        where lower(btrim(name)) = lower(btrim(source.property_name)) and deleted_at is not null) then
        raise exception 'Property % is archived. Resolve it before seeding.', source.property_name;
      end if;
      insert into public.properties (name, address)
      values (source.property_name, source.property_address) returning id into property_key;
    end if;

    update demo_invoice_history_sources set vendor_id = vendor_key, property_id = property_key
    where source_file = source.source_file;

    for month in select * from (values (1, 0.85::numeric), (2, 1.18::numeric), (3, 0.80::numeric))
      as history(months_back, amount_factor) loop
      bill_date := (source.source_date - make_interval(months => month.months_back))::date;
      bill_due_date := (source.source_due_date - make_interval(months => month.months_back))::date;
      bill_amount := round(source.source_amount * month.amount_factor, 2);
      bill_reference := 'DEMO-HIST-' || upper(source.slug) || '-' || to_char(bill_date, 'YYYYMM');
      confirmation := 'DEMO-PAID-' || upper(source.slug) || '-' || to_char(bill_date, 'YYYYMM');

      insert into public.invoices (
        date, reference_number, vendor_id, property_id, amount, due_date,
        payment_url, status, payment_confirmation_number
      ) values (
        bill_date, bill_reference, vendor_key, property_key, bill_amount,
        bill_due_date, source.payment_url, 'paid', confirmation
      ) on conflict (vendor_id, property_id, (lower(btrim(reference_number))))
        where deleted_at is null do nothing;

      select * into saved_invoice from public.invoices
      where vendor_id = vendor_key and property_id = property_key
        and lower(btrim(reference_number)) = lower(bill_reference);
      if not found then raise exception 'Could not create history invoice %', bill_reference; end if;
      if saved_invoice.date is distinct from bill_date
        or saved_invoice.due_date is distinct from bill_due_date
        or saved_invoice.amount is distinct from bill_amount
        or saved_invoice.status is distinct from 'paid'
        or saved_invoice.payment_confirmation_number is distinct from confirmation
        or saved_invoice.deleted_at is not null then
        raise exception 'Existing synthetic invoice % for % / % conflicts with the seed. No data was changed.',
          bill_reference, source.vendor_name, source.property_name;
      end if;
    end loop;
  end loop;
end;
$$;

-- Expected: 30 paid invoices, three for each of the ten PDF vendor/property pairs.
select source.vendor_name, source.property_name, source.account_number,
  invoice.reference_number, invoice.date, invoice.due_date, invoice.amount,
  invoice.status, invoice.payment_confirmation_number
from demo_invoice_history_sources as source
join public.invoices as invoice
  on invoice.vendor_id = source.vendor_id and invoice.property_id = source.property_id
where invoice.reference_number in (
  'DEMO-HIST-' || upper(source.slug) || '-202607',
  'DEMO-HIST-' || upper(source.slug) || '-202608',
  'DEMO-HIST-' || upper(source.slug) || '-202609'
)
order by source.vendor_name, invoice.date;

commit;
