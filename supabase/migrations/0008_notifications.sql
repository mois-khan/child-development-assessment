-- ═══════════════════════════════════════════════════════════════════════════
-- Notifications: an in-app inbox, plus browser push as a delivery channel
--
-- Two tables with different write rules, on purpose:
--
--   notifications      — what happened, kept forever until the user reads
--                         it. Written ONLY by the server (service role),
--                         same posture as `payments`: a client that could
--                         insert its own notifications could also fake
--                         "your report is ready" for someone else's child.
--                         A signed-in user may only SELECT and mark their
--                         own rows read.
--
--   push_subscriptions — which devices to ring for a given user. Written by
--                         the user's OWN browser right after it asks for
--                         permission, so this one IS insert/delete-able by
--                         its owner — subscribing is a client-side action,
--                         and there is nothing sensitive in a public key.
--
-- The in-app inbox is the reliable baseline: it works with zero permission
-- prompts and survives a declined or revoked notification permission. Push
-- is strictly additive — see lib/notifications/send.ts, which always writes
-- a notifications row and only ALSO pushes when a subscription exists.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null
                check (type in ('report_ready', 'reminder', 'broadcast')),
  title       text not null,
  body        text not null default '',
  -- Where clicking the notification should take the user, e.g.
  -- "/children/<id>?tab=report". Relative, resolved against the app origin.
  url         text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index notifications_by_user on public.notifications (user_id, created_at desc);
create index notifications_unread on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_read on public.notifications
  for select using (user_id = auth.uid());
-- "using" alone covers UPDATE's read side; WITH CHECK defaults to the same
-- expression, which also stops a user from reassigning their own row to
-- someone else's user_id on the way out.
create policy notifications_mark_read on public.notifications
  for update using (user_id = auth.uid());

-- Lets the bell update live instead of on a poll — see
-- lib/notifications/use-notifications.ts.
alter publication supabase_realtime add table public.notifications;


-- ─── push_subscriptions ─────────────────────────────────────────────────────

create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth_key    text not null,
  user_agent  text not null default '',
  created_at  timestamptz not null default now()
);

create index push_subscriptions_by_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_owner on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
