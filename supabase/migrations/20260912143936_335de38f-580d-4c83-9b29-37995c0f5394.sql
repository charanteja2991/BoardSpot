CREATE POLICY "billboard_images_read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'billboard-images');
CREATE POLICY "billboard_images_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'billboard-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "billboard_images_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'billboard-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "billboard_images_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'billboard-images' AND (storage.foldername(name))[1] = auth.uid()::text);