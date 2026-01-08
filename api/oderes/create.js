import { Client } from 'pg';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const form = formidable();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: 'Invalid form' });
    }

    const data = JSON.parse(fields.data);
    const client = new Client({
      connectionString: process.env.DATABASE_URL
    });

    await client.connect();

    try {
      await client.query('BEGIN');

      const orderRes = await client.query(
        `
        INSERT INTO orders
        (name, company, phone, country, notes)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING id
        `,
        [
          data.customer.name,
          data.customer.company,
          data.customer.phone,
          data.customer.country,
          data.notes
        ]
      );

      const orderId = orderRes.rows[0].id;

      for (const item of data.products) {
        await client.query(
          `
          INSERT INTO order_items
          (order_id, product_id, title, qty, condition)
          VALUES ($1,$2,$3,$4,$5)
          `,
          [
            orderId,
            item.product_id,
            item.title,
            item.qty,
            item.condition
          ]
        );
      }

      if (files.files) {
        const list = Array.isArray(files.files)
          ? files.files
          : [files.files];

        for (const file of list) {
          await client.query(
            `
            INSERT INTO order_files
            (order_id, filename, mimetype, size)
            VALUES ($1,$2,$3,$4)
            `,
            [orderId, file.originalFilename, file.mimetype, file.size]
          );
        }
      }

      await client.query('COMMIT');
      res.status(200).json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(e);
      res.status(500).json({ error: 'DB error' });
    } finally {
      await client.end();
    }
  });
}
