-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 0027 — Report PDF URL (Cloudflare R2 immutable snapshot)
--
-- Purpose:
--   Store the URL of the frozen PDF snapshot generated at assessment
--   completion and uploaded to Cloudflare R2. Once set, this URL is the
--   canonical, immutable version of the report — regardless of future
--   logic/design changes.
--
-- Column: report_pdf_url  TEXT NULL
--   NULL  → PDF has not yet been generated (dynamic render is the fallback)
--   value → Publicly accessible URL on Cloudflare R2 (or signed URL)
--
-- No existing rows are affected; the column defaults to NULL, meaning the
-- current dynamic-render path remains the fallback for all historical
-- assessments.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.assessments
  add column if not exists report_pdf_url text default null;

comment on column public.assessments.report_pdf_url is
  'Immutable PDF snapshot URL stored in Cloudflare R2. '
  'Set once at assessment completion, never updated thereafter. '
  'NULL means the PDF has not yet been archived (fall back to dynamic render).';
