-- Public catalogue policies call this boolean helper so authenticated staff can
-- also see drafts. Anonymous visitors receive false because auth.uid() is null.
grant execute on function private.is_active_staff() to anon;
