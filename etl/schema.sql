CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS manufacturers (
  slug        text PRIMARY KEY,
  name        text NOT NULL,
  source_url  text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_slug  text NOT NULL REFERENCES manufacturers(slug) ON DELETE CASCADE,
  part_number text NOT NULL,
  title       text,
  url         text NOT NULL,
  availability text,
  category    text,
  series      text,
  raw         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_slug);
CREATE INDEX IF NOT EXISTS idx_products_part ON products(part_number);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_brand_part ON products(brand_slug, part_number);

CREATE OR REPLACE VIEW v_products AS
SELECT id, brand_slug, part_number, title, url, availability, category, series
FROM products;
