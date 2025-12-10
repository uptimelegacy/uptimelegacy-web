# UptimeLegacy – ETL (Neon-ready)
1) cd etl
2) npm i
3) npx playwright install chromium
4) npm run scrape:demo          # 1ª página por fabricante (prueba)
5) CONCURRENCY=2 POLITE_DELAY_MS=800 MAX_PAGES=0 npm run scrape:all  # completo

Salida: out/manufacturers.csv, out/products.csv
Importar con psql usando schema.sql.
