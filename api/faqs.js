import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const { category, lang } = req.query;

  if (!category || !lang) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`
    SELECT question, answer
    FROM faqs
    WHERE category = ${category}
      AND lang = ${lang}
    ORDER BY position ASC
  `;

  res.status(200).json(rows);
}
