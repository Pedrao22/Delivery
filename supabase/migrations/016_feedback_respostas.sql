-- Add response tracking fields to feedbacks table
ALTER TABLE feedbacks
ADD COLUMN IF NOT EXISTS respondido_em TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notif_lida BOOLEAN DEFAULT false;
