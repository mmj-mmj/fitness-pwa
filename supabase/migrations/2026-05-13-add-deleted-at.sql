alter table public.workouts
add column if not exists deleted_at timestamptz;
