-- link_stats is security invoker (RLS applies), but there's no reason for the public key to reach it.
revoke execute on function public.link_stats(uuid, timestamptz, timestamptz, text, boolean) from public, anon;
grant execute on function public.link_stats(uuid, timestamptz, timestamptz, text, boolean) to authenticated;

-- Trigger-only functions: not callable through the API.
revoke execute on function public.bump_click_count() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
