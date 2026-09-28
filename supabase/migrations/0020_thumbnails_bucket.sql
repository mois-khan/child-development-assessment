insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

create policy "Public Access" on storage.objects for select using ( bucket_id = 'thumbnails' );
create policy "Auth Upload" on storage.objects for insert with check ( bucket_id = 'thumbnails' and auth.role() = 'authenticated' );
create policy "Auth Update" on storage.objects for update with check ( bucket_id = 'thumbnails' and auth.role() = 'authenticated' );
create policy "Auth Delete" on storage.objects for delete using ( bucket_id = 'thumbnails' and auth.role() = 'authenticated' );
