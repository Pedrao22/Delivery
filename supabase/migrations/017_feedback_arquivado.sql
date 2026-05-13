-- Add archive support to feedbacks table
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS arquivado BOOLEAN DEFAULT false;
