-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0029 — Allow public select on item_overrides
--
-- Why:
-- 0009 restricted `item_overrides_read` to `(auth.uid() is not null)`.
-- The question bank contains only clinical assessment question text and metadata,
-- no PII. Restricting select to authenticated users causes unauthenticated
-- visitors viewing assessment reports (e.g. parents viewing shared report links)
-- to receive 0 questions, breaking scoring and showing A-- (0%) across all domains.
--
-- This migration updates item_overrides_read to `using (true)`, matching the
-- design of `cms_blocks_read`. Admin writes remain protected by item_overrides_admin.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists item_overrides_read on public.item_overrides;

create policy item_overrides_read on public.item_overrides
  for select
  using (true);
