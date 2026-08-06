-- Bucket de fotos de perfil (privado — apenas o dono acessa; visibilidade para
-- outros usuários entra junto com o milestone de matching/discovery).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-photos', 'profile-photos', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Caminho dos arquivos: "{userId}/{photoId}.{ext}" — o primeiro segmento do path
-- precisa bater com o auth.uid() do usuário autenticado.
CREATE POLICY "profile_photos_storage_select_own" ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "profile_photos_storage_insert_own" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "profile_photos_storage_update_own" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text)
    WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);

CREATE POLICY "profile_photos_storage_delete_own" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = (select auth.uid())::text);
