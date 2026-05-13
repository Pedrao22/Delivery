-- Bucket público para imagens dos produtos do cardápio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: service_role pode fazer tudo
CREATE POLICY "service_role_product_images"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Política: leitura pública
CREATE POLICY "public_read_product_images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'product-images');
