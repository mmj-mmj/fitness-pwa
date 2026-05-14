create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text not null,
  body_part text not null default '',
  exercises jsonb not null default '[]'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workouts enable row level security;

drop policy if exists "Users can read own workouts" on public.workouts;
drop policy if exists "Users can insert own workouts" on public.workouts;
drop policy if exists "Users can update own workouts" on public.workouts;
drop policy if exists "Users can delete own workouts" on public.workouts;

create policy "Users can read own workouts"
on public.workouts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own workouts"
on public.workouts
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own workouts"
on public.workouts
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own workouts"
on public.workouts
for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists workouts_user_id_date_idx
on public.workouts (user_id, date desc);

create index if not exists workouts_user_id_updated_at_idx
on public.workouts (user_id, updated_at desc);
