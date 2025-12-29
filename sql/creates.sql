CREATE TABLE IF NOT EXISTS rfq_requests (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  part_number TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  conditions TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  page_url TEXT,
  locale TEXT
);



DROP TABLE IF EXISTS faqs;

CREATE TABLE faqs (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  question_key VARCHAR(100) NOT NULL,
  lang CHAR(2) NOT NULL CHECK (lang IN ('en','es')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_faqs_category_lang ON faqs(category, lang);



CREATE TABLE IF NOT EXISTS legal_pages (
  id SERIAL PRIMARY KEY,
  page TEXT NOT NULL,            -- 'terms' | 'privacy' | 'cookies'
  section_key TEXT NOT NULL,     -- 'intro', 'data', 'cookies_usage', etc.
  lang TEXT NOT NULL,            -- 'en' | 'es'
  title TEXT NOT NULL,
  content TEXT NOT NULL,         -- HTML allowed
  position INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_legal_pages_page_lang
  ON legal_pages (page, lang);

CREATE INDEX IF NOT EXISTS idx_legal_pages_order
  ON legal_pages (page, lang, position);

