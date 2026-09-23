-- Fix: greatest(NULL, 0) returns 0 in Postgres, so a beacon that omitted a metric
-- (e.g. no INP because the user never interacted) used to overwrite a stored
-- value with 0. Missing/invalid metrics are now ignored instead.
create or replace function record_pulse(p_view_id uuid, p_seconds int, p_scroll int, p_lcp int, p_cls numeric, p_inp int)
returns void
language sql set search_path = public
as $$
  update page_views set
    seconds    = greatest(coalesce(seconds, 0), least(greatest(coalesce(p_seconds, 0), 0), 3600)),
    max_scroll = greatest(coalesce(max_scroll, 0), least(greatest(coalesce(p_scroll, 0), 0), 100)),
    lcp_ms     = case when p_lcp > 0  then least(p_lcp, 120000)  else lcp_ms end,
    cls        = case when p_cls >= 0 then least(p_cls, 99.999)  else cls end,
    inp_ms     = case when p_inp > 0  then least(p_inp, 60000)   else inp_ms end
  where view_id = p_view_id;
$$;

revoke all on function record_pulse(uuid, int, int, int, numeric, int) from public, anon, authenticated;
grant execute on function record_pulse(uuid, int, int, int, numeric, int) to service_role;
