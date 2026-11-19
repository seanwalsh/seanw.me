-- Advisor 0011: pin search_path on the updated_at trigger function.
alter function public.touch_updated_at() set search_path = '';
