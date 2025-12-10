-- === Ajusta estas dos rutas ===
\set CSV_M '/Users/clouddistrict/Documents/devs/uptimelegacy/etl/out/manufacturers.csv'
\set CSV_P '/Users/clouddistrict/Documents/devs/uptimelegacy/etl/out/products.csv'

SET search_path = public;
\set ON_ERROR_STOP on;

-- 1) staging: manufacturers
DROP TABLE IF EXISTS staging_manufacturers;
CREATE TEMP TABLE staging_manufacturers (
  slug       text,
  name       text,
  source_url text
);

\copy staging_manufacturers(slug,name,source_url) FROM :'CSV_M' WITH (FORMAT csv, HEADER true)

-- 2) UPSERT manufacturers con normalización
WITH m_src AS (
  SELECT
    lower(trim(slug)) AS slug_norm,
    -- quita "View All Products" si aparece y limpia espacios
    regexp_replace(coalesce(name,''), '(?i)\\bView All Products\\b', '', 'g') AS name_clean,
    trim(source_url) AS source_url
  FROM staging_manufacturers
  WHERE slug IS NOT NULL AND slug <> ''
),
m_pick AS (
  -- elegir una fila por slug (preferimos nombre no vacío y más largo)
  SELECT DISTINCT ON (slug_norm)
    slug_norm AS slug,
    NULLIF(btrim(name_clean), '') AS name,
    source_url
  FROM m_src
  ORDER BY slug_norm, (NULLIF(btrim(name_clean), '') IS NOT NULL) DESC, length(name_clean) DESC
)
INSERT INTO manufacturers (slug, name, source_url)
SELECT
  slug,
  COALESCE(name, initcap(replace(slug, '-', ' '))) AS name,
  source_url
FROM m_pick
ON CONFLICT (slug)
DO UPDATE SET
  name = EXCLUDED.name,
  source_url = EXCLUDED.source_url;

-- 3) staging: products
DROP TABLE IF EXISTS staging_products;
CREATE TEMP TABLE staging_products (
  brand_slug   text,
  part_number  text,
  title        text,
  url          text,
  availability text,
  category     text,
  series       text,
  raw          text
);

\copy staging_products(brand_slug,part_number,title,url,availability,category,series,raw) FROM :'CSV_P' WITH (FORMAT csv, HEADER true)

-- 4) Diagnóstico opcional: ¿productos con marca que NO existe?
-- SELECT DISTINCT lower(trim(brand_slug)) AS brand_slug
-- FROM staging_products sp
-- LEFT JOIN manufacturers m ON m.slug = lower(trim(sp.brand_slug))
-- WHERE m.slug IS NULL
-- LIMIT 20;

-- 5) UPSERT products con normalización + dedupe
WITH p_src AS (
  SELECT
    lower(trim(brand_slug))     AS brand_slug_norm,
    trim(part_number)           AS part_norm,
    NULLIF(trim(title), '')     AS title_norm,
    trim(url)                   AS url_norm,
    NULLIF(trim(availability),'') AS availability_norm,
    NULLIF(trim(category), '')    AS category_norm,
    NULLIF(trim(series), '')      AS series_norm,
    raw
  FROM staging_products
  WHERE brand_slug IS NOT NULL AND brand_slug <> ''
    AND part_number IS NOT NULL AND part_number <> ''
    AND url IS NOT NULL AND url <> ''
),
p_dedupe AS (
  -- elegimos 1 fila por (brand, part); preferimos título más largo
  SELECT DISTINCT ON (brand_slug_norm, part_norm)
    brand_slug_norm AS brand_slug,
    part_norm       AS part_number,
    title_norm      AS title,
    url_norm        AS url,
    availability_norm AS availability,
    category_norm     AS category,
    series_norm       AS series,
    CASE
      WHEN raw IS NULL OR raw = '' THEN '{}'::jsonb
      WHEN raw ~ '^\s*\{.*\}\s*$' THEN raw::jsonb
      ELSE '{}'::jsonb
    END AS raw
  FROM p_src
  ORDER BY brand_slug_norm, part_norm, length(coalesce(title_norm,'')) DESC
)
INSERT INTO products (brand_slug, part_number, title, url, availability, category, series, raw)
SELECT
  p.brand_slug, p.part_number, p.title, p.url, p.availability, p.category, p.series, p.raw
FROM p_dedupe p
JOIN manufacturers m ON m.slug = p.brand_slug   -- garantiza FK
ON CONFLICT (brand_slug, part_number)
DO UPDATE SET
  title        = COALESCE(EXCLUDED.title, products.title),
  url          = EXCLUDED.url,
  availability = COALESCE(EXCLUDED.availability, products.availability),
  category     = COALESCE(EXCLUDED.category, products.category),
  series       = COALESCE(EXCLUDED.series, products.series),
  raw          = EXCLUDED.raw;

-- 6) Checks
SELECT count(*) AS manufacturers FROM manufacturers;
SELECT count(*) AS products      FROM products;

-- Muestras
SELECT * FROM manufacturers ORDER BY slug LIMIT 5;
SELECT brand_slug, part_number, coalesce(title,'') AS title FROM products LIMIT 10;

