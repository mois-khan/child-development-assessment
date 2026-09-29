drop table if exists public.cms_blocks cascade;

create table public.cms_blocks (
    id text primary key,
    content text not null,
    description text not null default '',
    updated_at timestamptz not null default now()
);

alter table public.cms_blocks enable row level security;

create policy "Anyone can read cms blocks" on public.cms_blocks
    for select using (true);

create policy "Admins can insert cms blocks" on public.cms_blocks
    for insert with check (
        exists (select 1 from public.admin_users where id = auth.uid())
    );

create policy "Admins can update cms blocks" on public.cms_blocks
    for update using (
        exists (select 1 from public.admin_users where id = auth.uid())
    );
