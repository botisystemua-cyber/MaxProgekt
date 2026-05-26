-- BotiRestaurant — secure RLS
-- Заміняє MVP anon-write на authenticated-write.
-- Після цієї міграції:
--   - анонімний клієнт (гость з QR) — може тільки SELECT
--   - автентифікований (адмін після signInWithPassword) — повний доступ
--
-- Supabase Автоматично додає JWT в Authorization header на кожен запит
-- після входу; PostgreSQL бачить роль 'authenticated' замість 'anon'.

drop policy if exists "anon write settings" on public.restaurant_settings;
drop policy if exists "anon write items"    on public.restaurant_items;
drop policy if exists "anon write banner"   on public.restaurant_banner;

create policy "authenticated write settings" on public.restaurant_settings
  for all to authenticated using (true) with check (true);

create policy "authenticated write items" on public.restaurant_items
  for all to authenticated using (true) with check (true);

create policy "authenticated write banner" on public.restaurant_banner
  for all to authenticated using (true) with check (true);
