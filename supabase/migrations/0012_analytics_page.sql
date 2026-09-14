-- Register the Analytics page in the admin page-access registry so it can
-- be granted to non-super_admin roles the same way every other admin page
-- is (see 0002_recommendations.sql for the registry itself).

insert into public.admin_pages (id, label, description, sort_order) values
  ('analytics', 'Analytics', 'Lead-to-completion funnel and drop-off by section', 12)
on conflict (id) do nothing;
