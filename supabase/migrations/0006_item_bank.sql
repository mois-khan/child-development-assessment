-- ═══════════════════════════════════════════════════════════════════════════
-- Kaushalya Developmental Screening Platform — editable item bank
--
-- 0001_core.sql deliberately kept the question bank out of Postgres: it is a
-- clinical instrument transcribed from a printed booklet, and having it
-- reviewable in git beats having it editable by a stray click.
--
-- That reasoning still holds for the BASE bank, so content/items.ts stays
-- exactly where it is. What this table adds is the diff on top of it: the
-- edits, additions and retirements the child development team makes after a
-- deploy. Three properties fall out of storing only the diff:
--
--   1. The shipped booklet transcription remains the reviewable source of
--      truth. `git log content/items.ts` still answers "what did the booklet
--      say".
--   2. Reverting an edit is a DELETE, not a re-transcription — the base row
--      is never overwritten, so "put it back the way the booklet has it" can
--      never lose the booklet's wording.
--   3. The table stays small (tens of rows, not ~500), so the whole overlay
--      is one cheap fetch the assessment page can prime before the first
--      question renders. See lib/item-bank.ts.
--
-- `id` is TEXT, not a uuid, because it has to be able to BE a base item id
-- ("s5-vision-01") — that is the join key back to content/items.ts and to
-- responses.item_id. Rows the admin adds get a generated text id instead.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.item_overrides (
  id              text        primary key,
  domain          text        not null
                                check (domain in ('vision','auditory','tactile',
                                                  'mobility','language','hand')),
  stage_id        text        not null,
  text            text        not null default '',
  how             text        not null default '',
  kind            text        not null default 'yesno'
                                check (kind in ('yesno','choice','count','percent','text')),
  source          text        not null default 'AUTHORED'
                                check (source in ('ACE','AUTHORED')),
  invert          boolean     not null default false,
  min_age_months  numeric,
  choices         text[],
  unit            text,
  -- A soft retirement of a base item. The row exists purely to say "do not
  -- ask this one" — hard-deleting is not an option, because the base item
  -- would simply reappear from content/items.ts on the next render.
  deleted         boolean     not null default false,
  updated_by      uuid        references public.admin_users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.item_overrides is
  'Admin edits layered on top of content/items.ts. One row per changed, added '
  'or retired item — never a full copy of the bank. Merged at read time by '
  'lib/item-bank.ts.';

comment on column public.item_overrides.id is
  'A base item id from content/items.ts (e.g. "s5-vision-01") for an edit or '
  'retirement, or a generated id for an admin-authored addition.';

-- The one query the assessment path makes is "everything for this cell", and
-- the one the admin list makes is "everything for this competence".
create index item_overrides_cell on public.item_overrides (domain, stage_id);

create trigger item_overrides_touch
  before update on public.item_overrides
  for each row execute function public.touch_updated_at();

alter table public.item_overrides enable row level security;

-- Parents must be able to READ the overlay — it is what they are asked during
-- an assessment. Only admins may write it.
create policy item_overrides_read
  on public.item_overrides for select using (true);

create policy item_overrides_admin
  on public.item_overrides for all using (public.is_admin());
