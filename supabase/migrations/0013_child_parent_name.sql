-- A school's add-student form needs to capture the guardian's name, not just
-- phone/email (0004_child_contact.sql) — a school adding a whole class needs
-- to write down whose child this is before they've necessarily got a number
-- or address for that guardian.
alter table public.children
  add column if not exists parent_name text;
