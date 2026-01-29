export const runtime = "nodejs";

import { sql } from "@vercel/postgres";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const { customer, notes, items, attachments } = req.body;

    if (!customer || !items?.length) {
      res.status(400).end("Invalid payload");
      return;
    }

    const { rows } = await sql`
      INSERT INTO orders (name, company, phone, country, notes)
      VALUES (
        ${customer.name},
        ${customer.company},
        ${customer.phone},
        ${customer.country || null},
        ${notes || null}
      )
      RETURNING id
    `;

    const orderId = rows[0].id;

    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, title, qty, condition)
        VALUES (
          ${orderId},
          ${item.title},
          ${item.qty},
          ${item.condition}
        )
      `;
    }

    if (attachments?.length) {
      for (const file of attachments) {
        await sql`
          INSERT INTO order_files (
            order_id,
            filename,
            mimetype,
            size,
            url
          )
          VALUES (
            ${orderId},
            ${file.name},
            ${file.type},
            ${file.size},
            ${file.url}
          )
        `;
      }
    }


    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const attachmentsHtml = attachments?.length
      ? `<ul>${attachments
          .map(
            f =>
              `<li><a href="${f.url}" target="_blank" rel="noopener">${f.name}</a></li>`
          )
          .join("")}</ul>`
      : "<p>No attachments</p>";

    if (process.env.SMTP_HOST && process.env.CONTACT_TO) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.CONTACT_TO,
          subject: "New Order Quote Request",
          html: `
            <h2>New order received</h2>

            <p><strong>Name:</strong> ${customer.name}</p>
            <p><strong>Company:</strong> ${customer.company}</p>
            <p><strong>Email:</strong> ${customer.email || "-"}</p>
            <p><strong>Phone:</strong> ${customer.phone}</p>

            <h3>Items</h3>
            <ul>
              ${items
                .map(
                  i =>
                    `<li>${i.title} × ${i.qty} (${i.condition})</li>`
                )
                .join("")}
            </ul>

            <h3>Notes</h3>
            <p>${notes || "-"}</p>

            <h3>Attachments</h3>
            ${attachmentsHtml}
          `
        });
      } catch (e) {
        console.error("[orders] email failed", e);
      }
    }

    res.json({ ok: true, orderId });
  } catch (e) {
    console.error("[orders] FATAL ERROR");
    console.error(e?.message);
    console.error(e?.stack);
    res.status(500).json({
      error: e?.message || "unknown error"
    });
  }
}
