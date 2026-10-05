-- OPTIONAL: run in the Supabase SQL editor only if image upload fails with a policy error.
-- Create the bucket "billboard-images" first (Storage > New bucket).
-- Lets signed-in users upload/delete files inside their own folder (<user-id>/...).
DROP POLICY IF EXISTS "billboard_images_upload_own" ON storage.objects;
CREATE POLICY "billboard_images_upload_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'billboard-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "billboard_images_delete_own" ON storage.objects;
CREATE POLICY "billboard_images_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'billboard-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Needed so signed URLs / public reads work for visitors browsing listings.
DROP POLICY IF EXISTS "billboard_images_read" ON storage.objects;
CREATE POLICY "billboard_images_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'billboard-images');
