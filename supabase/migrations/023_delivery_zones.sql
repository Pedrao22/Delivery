-- Add geocoordinates to restaurantes for distance calculation
ALTER TABLE restaurantes
  ADD COLUMN IF NOT EXISTS lat  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng  DOUBLE PRECISION;

-- Delivery zones: km ranges + fee per restaurant
CREATE TABLE IF NOT EXISTS delivery_zones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurante_id UUID        NOT NULL REFERENCES restaurantes(id) ON DELETE CASCADE,
  label          TEXT,
  min_km         NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_km         NUMERIC(6,2) NOT NULL DEFAULT 5,
  fee            NUMERIC(8,2) NOT NULL DEFAULT 0,
  sort_order     INT          NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ  DEFAULT now(),
  updated_at     TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_restaurante ON delivery_zones(restaurante_id);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_order       ON delivery_zones(restaurante_id, sort_order);

ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

-- Backend (service role) has full access; anon has none
CREATE POLICY "service_full_access" ON delivery_zones
  FOR ALL USING (true) WITH CHECK (true);
