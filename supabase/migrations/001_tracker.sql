-- Run once in the Supabase SQL Editor. No service-role key is needed in the app.
create table public.tracker_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now(),
  constraint tracker_shape check (
    jsonb_typeof(data) = 'object' and
    data ?& array['schools','materials','professors','documents','recommenders','interviews'] and
    jsonb_typeof(data->'schools') = 'array' and
    jsonb_typeof(data->'materials') = 'array' and
    jsonb_typeof(data->'professors') = 'array' and
    jsonb_typeof(data->'documents') = 'array' and
    jsonb_typeof(data->'recommenders') = 'array' and
    jsonb_typeof(data->'interviews') = 'array'
  )
);
alter table public.tracker_snapshots enable row level security;
create policy "Read own tracker" on public.tracker_snapshots
  for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.tracker_snapshots from anon, authenticated;
grant select on public.tracker_snapshots to authenticated;

-- All writes use an atomic compare-and-swap. Stale devices cannot overwrite newer data.
create function public.save_tracker(expected_version bigint, payload jsonb)
returns setof public.tracker_snapshots
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if expected_version = 0 then
    return query insert into public.tracker_snapshots(user_id, data)
      values (actor, payload) on conflict (user_id) do nothing returning *;
  else
    return query update public.tracker_snapshots
      set data = payload, version = version + 1, updated_at = now()
      where user_id = actor and version = expected_version returning *;
  end if;
end;
$$;
revoke all on function public.save_tracker(bigint, jsonb) from public, anon;
grant execute on function public.save_tracker(bigint, jsonb) to authenticated;
