-- ═══════════════════════════════════════════════════════════════════════════
-- School accounts
--
-- THE SHAPE
--
--   A school is one login with many students. It is not a second parent
--   table bolted alongside — a school account IS a profiles row, exactly
--   like an individual parent, so it inherits every "my children" query,
--   every RLS policy on children/assessments/responses, and every report
--   page for free. The only new table is `schools`, a 1:1 extension of
--   profiles holding the institutional details a parent profile has no use
--   for (school name, address, a named contact person).
--
--   children.parent_email / parent_phone already exist for exactly this
--   case (see 0004_child_contact.sql) — a school's own login has no bearing
--   on who a given student's actual guardian is, so that contact hangs off
--   the child, not the account.
--
-- HOW AN ACCOUNT BECOMES A SCHOOL
--
--   The same way an account becomes staff: `raw_user_meta_data.account_type
--   = 'school'` at signup, read by handle_new_user() below. Nothing here
--   creates that metadata — see app/api/admin/invite-school, which calls
--   Supabase's admin invite API the same way app/api/admin/invite already
--   does for staff. A school is never self-serve: it is provisioned by an
--   admin after a sale, which is also why it gets no `leads` row — sales
--   already closed this account before it exists.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.profiles
  add column if not exists account_type text not null default 'parent'
    check (account_type in ('parent', 'school'));

comment on column public.profiles.account_type is
  'parent: an individual family (the default, and the only type that can '
  'self-signup). school: an institutional account provisioned by an admin — '
  'see public.schools for its details and app/api/admin/invite-school.';


-- ─── schools ────────────────────────────────────────────────────────────────

create table public.schools (
  id            uuid primary key references public.profiles (id) on delete cascade,
  school_name   text not null,
  contact_name  text not null default '',
  contact_phone text not null default '',
  address       text not null default '',
  city          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger schools_touch before update on public.schools
  for each row execute function public.touch_updated_at();

-- Mirrors is_admin(): SECURITY DEFINER so RLS policies elsewhere (children,
-- assessments) could grant schools broader read access later without every
-- caller needing direct rights on this table. Not used by children's RLS
-- yet — a school's students are just rows it owns via profile_id, same as
-- any parent — but middleware and the admin panel both need a fast "is this
-- signed-in account a school" check, and one function is the single place
-- that answers it.
create or replace function public.is_school()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.schools where id = auth.uid());
$$;

alter table public.schools enable row level security;

create policy schools_self_read on public.schools
  for select using (id = auth.uid() or public.is_admin());
create policy schools_self_update on public.schools
  for update using (id = auth.uid());
create policy schools_admin_write on public.schools
  for insert with check (public.is_admin());


-- ─── handle_new_user(): teach it about the school branch ──────────────────
--
-- CREATE OR REPLACE on the exact function 0001_core.sql defined — the
-- trigger that already fires on every auth.users insert keeps pointing at
-- this same function name, so no trigger changes are needed.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Staff are created through the Supabase dashboard/invite API with a flag
  -- in their metadata. They are colleagues, not leads.
  if coalesce(new.raw_user_meta_data ->> 'is_admin', 'false') = 'true' then
    insert into public.admin_users (id, email, role)
    values (new.id,
            coalesce(new.email, ''),
            coalesce(new.raw_user_meta_data ->> 'role', 'sales'))
    on conflict (id) do nothing;
    return new;
  end if;

  -- Schools are invited the same way, with account_type = 'school'. They
  -- get a profiles row like anyone else (full_name holds the named contact,
  -- for anywhere generic profile UI reads it) plus a schools row for the
  -- institutional fields. No leads row: an admin invite means the deal
  -- already closed, so there is nothing left for sales to pursue.
  if coalesce(new.raw_user_meta_data ->> 'account_type', 'parent') = 'school' then
    insert into public.profiles (id, full_name, phone, email, account_type)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_phone', ''),
            coalesce(new.email, ''),
            'school')
    on conflict (id) do nothing;

    insert into public.schools (id, school_name, contact_name, contact_phone)
    values (new.id,
            coalesce(new.raw_user_meta_data ->> 'school_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_name', ''),
            coalesce(new.raw_user_meta_data ->> 'contact_phone', ''))
    on conflict (id) do nothing;

    return new;
  end if;

  insert into public.profiles (id, full_name, phone, email)
  values (new.id,
          coalesce(new.raw_user_meta_data ->> 'full_name', ''),
          coalesce(new.raw_user_meta_data ->> 'phone', ''),
          coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.leads (profile_id, status, source)
  values (new.id, 'new', 'signup')
  on conflict (profile_id) do nothing;

  return new;
end;
$$;


-- ─── admin panel: register the Schools page ────────────────────────────────

insert into public.admin_pages (id, label, description, sort_order) values
  ('schools', 'Schools', 'Institutional accounts and their student rosters', 11)
on conflict (id) do nothing;
