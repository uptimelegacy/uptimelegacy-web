// api/brands/[slug].js
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { slug } = req.query;
  try {
    const sql = neon(process.env.DATABASE_URL);
    const brand = await sql`SELECT slug, name FROM manufacturers WHERE slug = ${slug} LIMIT 1;`;
    if (!brand.length) return res.status(404).json({ error: 'Not found' });

    const products = await sql`
      SELECT brand_slug, part_number, title, url, availability, category, series
      FROM products
      WHERE brand_slug = ${slug}
      ORDER BY part_number ASC
      LIMIT 5000; -- ajusta si hace falta
    `;
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    res.status(200).json({ brand: brand[0], products });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
}
