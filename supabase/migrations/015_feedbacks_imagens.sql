-- Add images support to feedbacks table
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS imagens JSONB DEFAULT '[]'::jsonb;
