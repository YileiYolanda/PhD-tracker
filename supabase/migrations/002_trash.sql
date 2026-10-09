-- Existing projects: run this migration once, without rerunning 001_tracker.sql.
alter table public.tracker_snapshots add constraint tracker_trash_shape
  check (not (data ? 'trash') or jsonb_typeof(data->'trash') = 'array');

create or replace function public.save_tracker(expected_version bigint, payload jsonb)
returns setof public.tracker_snapshots
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required'; end if;
  if expected_version = 0 then
    return query insert into public.tracker_snapshots(user_id, data)
      values (actor, payload) on conflict (user_id) do nothing returning *;
  else
    -- Old browser tabs do not serialize trash. Never allow them to erase it.
    if not (payload ? 'trash') and exists (
      select 1 from public.tracker_snapshots where user_id = actor
        and version = expected_version and jsonb_array_length(coalesce(data->'trash', '[]'::jsonb)) > 0
    ) then
      raise exception '请刷新网页升级到支持回收站的版本，再保存数据。';
    end if;
    return query update public.tracker_snapshots
      set data = payload, version = version + 1, updated_at = now()
      where user_id = actor and version = expected_version returning *;
  end if;
end;
$$;
revoke all on function public.save_tracker(bigint, jsonb) from public, anon;
grant execute on function public.save_tracker(bigint, jsonb) to authenticated;
