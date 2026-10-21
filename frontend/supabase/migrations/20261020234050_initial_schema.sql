-- Initial application schema from supabase/erd.jpg.
-- auth.users is managed by Supabase.
-- Row level security policies are defined to allow any signed-in user to read and modify application data in this first version.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  role text
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  address text,
  user_id uuid not null unique references auth.users (id) on delete cascade
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  reference_number text not null,
  vendor_id uuid not null references public.vendors (id),
  due_date date,
  amount numeric(12, 2) not null,
  payment_url text,
  property_id uuid not null references public.properties (id),
  status text not null default 'pending',
  approved_by uuid references auth.users (id) on delete set null,
  date_approved timestamptz
);

create index invoices_vendor_id_idx on public.invoices (vendor_id);
create index invoices_property_id_idx on public.invoices (property_id);
create index invoices_approved_by_idx on public.invoices (approved_by);

alter table public.profiles enable row level security;
alter table public.vendors enable row level security;
alter table public.properties enable row level security;
alter table public.invoices enable row level security;

revoke all on table
  public.profiles,
  public.vendors,
  public.properties,
  public.invoices
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.vendors,
  public.properties,
  public.invoices
to authenticated;

create policy "Signed-in users can read profiles"
  on public.profiles for select to authenticated using (true);
create policy "Signed-in users can add profiles"
  on public.profiles for insert to authenticated with check (true);
create policy "Signed-in users can edit profiles"
  on public.profiles for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete profiles"
  on public.profiles for delete to authenticated using (true);

create policy "Signed-in users can read vendors"
  on public.vendors for select to authenticated using (true);
create policy "Signed-in users can add vendors"
  on public.vendors for insert to authenticated with check (true);
create policy "Signed-in users can edit vendors"
  on public.vendors for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete vendors"
  on public.vendors for delete to authenticated using (true);

create policy "Signed-in users can read properties"
  on public.properties for select to authenticated using (true);
create policy "Signed-in users can add properties"
  on public.properties for insert to authenticated with check (true);
create policy "Signed-in users can edit properties"
  on public.properties for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete properties"
  on public.properties for delete to authenticated using (true);

create policy "Signed-in users can read invoices"
  on public.invoices for select to authenticated using (true);
create policy "Signed-in users can add invoices"
  on public.invoices for insert to authenticated with check (true);
create policy "Signed-in users can edit invoices"
  on public.invoices for update to authenticated using (true) with check (true);
create policy "Signed-in users can delete invoices"
  on public.invoices for delete to authenticated using (true);
