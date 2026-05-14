-- 024_carousel_images.sql
-- Adiciona coluna para imagens do carrossel no cardápio público
ALTER TABLE restaurantes
ADD COLUMN IF NOT EXISTS carousel_images JSONB DEFAULT '[]'::jsonb;
