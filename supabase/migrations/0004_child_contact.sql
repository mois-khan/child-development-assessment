-- ═══════════════════════════════════════════════════════════════════════════
-- Kaushalya Developmental Screening Platform — per-child contact details
--
-- Why these live on the child and not just on the parent's profile:
--
--   1. The add-child form has always asked for a phone number, passed it to
--      createChild(), and had it silently dropped — there was no column to
--      put it in. Every number a parent has typed since launch is gone. This
--      is the column that was missing.
--
--   2. A school account is one login with many students, and each student's
--      guardian has their own email and number. A single contact pair on the
--      account holder's profile cannot represent that, so the contact has to
--      hang off the child.
--
-- Both are nullable and free text. An individual parent already gave us an
-- email at signup, so for them these are a "reach someone else about this
-- child" override, not a required field.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.children
  add column if not exists parent_email text,
  add column if not exists parent_phone text;

comment on column public.children.parent_email is
  'Guardian email for THIS child. Overrides profiles.email for anything about '
  'this child. Required in practice for school accounts, where the account '
  'holder is not the guardian.';

comment on column public.children.parent_phone is
  'Guardian phone for THIS child. The field the sales follow-up system needs '
  'to be useful — see lib/admin/leads.ts.';

-- Sales searches leads by contact detail; without these a lookup by a parent's
-- email or number has to scan every child row.
create index if not exists children_parent_email on public.children (parent_email)
  where parent_email is not null;
create index if not exists children_parent_phone on public.children (parent_phone)
  where parent_phone is not null;
