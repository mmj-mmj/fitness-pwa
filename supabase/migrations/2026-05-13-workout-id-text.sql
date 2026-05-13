alter table public.workouts
alter column id type text
using id::text;
