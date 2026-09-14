-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: the interaction log never showed up in the admin UI.
--
-- interactions.logged_by referenced auth.users(id) instead of
-- admin_users(id) (0001_core.sql). Every interaction insert worked fine —
-- the sync_lead_after_interaction trigger updated leads.last_interaction_at
-- and leads.next_follow_up_at correctly — but adminGetLead()'s query
-- (lib/admin/leads.ts) embeds `admin_users ( email )` on the interactions
-- table so it can show who logged each call. PostgREST can only auto-embed
-- across a direct foreign key, and there wasn't one between interactions
-- and admin_users — only an indirect path through auth.users, which
-- PostgREST doesn't traverse. The embedded select silently failed, and
-- since adminGetLead() doesn't check that query's error, the interaction
-- list just came back empty every time, even though the rows existed.
--
-- Every existing logged_by value already points at an admin_users row (only
-- admins can insert here, per interactions_admin_write) so retargeting the
-- FK is safe with no data loss.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.interactions
  drop constraint interactions_logged_by_fkey;

alter table public.interactions
  add constraint interactions_logged_by_fkey
  foreign key (logged_by) references public.admin_users (id) on delete set null;
