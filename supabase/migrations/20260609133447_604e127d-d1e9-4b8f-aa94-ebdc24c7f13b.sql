
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

ALTER FUNCTION public.touch_updated_at() SET search_path = public;

-- Storage policies for covers + audio buckets
CREATE POLICY "Authenticated read covers" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'covers');
CREATE POLICY "Anon read covers" ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'covers');
CREATE POLICY "Admins write covers" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update covers" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete covers" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated stream audio" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audio');
CREATE POLICY "Admins write audio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update audio" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete audio" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'audio' AND public.has_role(auth.uid(), 'admin'));
