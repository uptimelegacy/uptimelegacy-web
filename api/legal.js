import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const { page, lang } = req.query;

    if (!page || !lang) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const sql = neon(process.env.DATABASE_URL);

    const rows = await sql`
      SELECT section_key, title, content, position
      FROM legal_pages
      WHERE page = ${page}
        AND lang = ${lang}
      ORDER BY position ASC
    `;

    return res.status(200).json(rows);
  } catch (error) {
    console.error('LEGAL API ERROR:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
