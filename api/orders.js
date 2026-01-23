import { neon } from "@neondatabase/serverless";
import nodemailer from "nodemailer";

export const config = { runtime: "nodejs" };

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

function asString(v) {
  return String(v ?? "").trim();
}

function normalizeLocale(v) {
  const s = asString(v).toLowerCase();
  return s === "es" ? "es" : "en";
}

/* =========================
   EMAIL (igual que RFQ)
========================= */
async function sendOrderEmailIfConfigured(order, items, files) {
  const quoteTo = process.env.QUOTE_TO_EMAIL;
  if (!quoteTo) return { sent: false };

  const subject = `New Order Quote #${order.id}`;

  let text =
    `New Order Quote received\n\n` +
    `Order ID: ${order.id}\n` +
    `Name: ${order.name}\n` +
    `Company: ${order.company}\n` +
    `Email: ${order.email}\n` +
    `Phone: ${order.phone}\n` +
    `Country: ${order.country || "-"}\n` +
    `Notes: ${order.notes || "-"}\n\n` +
    `Products:\n`;

  items.forEach((p, i) => {
    text +=
      `${i + 1}. ${p.title || p.part_number || "Product"}\n` +
      `   Qty: ${p.qty}\n` +
      `   Condition: ${Array.isArray(p.condition) ? p.condition.join(", ") : p.condition}\n`;
  });

  if (files.length) {
    text += `\nAttachments:\n`;
    files.forEach((f, i) => {
      text += `${i + 1}. ${f.filename}\n   ${f.url}\n`;
    });
  }

  // SMTP (Gmail) – mismo patrón que RFQ
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return { sent: false };

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || user,
      to: quoteTo,
      subject,
      text
    });

    return { sent: true, provider: "smtp" };
  } catch (e) {
    console.error("[orders] email error", e);
    return { sent: false };
  }
}

/* =========================
   HANDLER
========================= */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST")
    return json(res, 405, { ok: false, error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const customer = body.customer || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const files = Array.isArray(body.files) ? body.files : [];

  const name = asString(customer.name);
  const company = asString(customer.company);
  const phone = asString(customer.phone);
  const email = asString(customer.email);
  const country = asString(customer.country);
  const notes = asString(customer.notes);
  const locale = normalizeLocale(body.locale);

  if (!name || !company || !phone || !isEmail(email)) {
    return json(res, 400, { ok: false, error: "Invalid customer data" });
  }

  if (!items.length) {
    return json(res, 400, { ok: false, error: "No products provided" });
  }

  if (!process.env.DATABASE_URL) {
    return json(res, 500, { ok: false, error: "Database not configured" });
  }

  const sql = neon(process.env.DATABASE_URL);

  let orderRow;
  let orderItems = [];
  let orderFiles = [];

  try {
    await sql.begin(async (tx) => {
      // 1️⃣ orders
      const [order] = await tx`
        INSERT INTO orders
          (name, company, phone, country, notes)
        VALUES
          (${name}, ${company}, ${phone}, ${country || null}, ${notes || null})
        RETURNING *;
      `;
      orderRow = order;

      // 2️⃣ order_items
      for (const item of items) {
        const qty = parseInt(item.qty, 10);
        if (!Number.isFinite(qty) || qty < 1) continue;

        const [row] = await tx`
          INSERT INTO order_items
            (order_id, product_id, title, qty, condition)
          VALUES
            (
              ${order.id},
              ${item.product_id || null},
              ${asString(item.title)},
              ${qty},
              ${Array.isArray(item.condition) ? item.condition.join(",") : asString(item.condition)}
            )
          RETURNING *;
        `;
        orderItems.push(row);
      }

      // 3️⃣ order_files
      for (const file of files) {
        if (!file.url) continue;

        const [row] = await tx`
          INSERT INTO order_files
            (order_id, filename, mimetype, size)
          VALUES
            (
              ${order.id},
              ${asString(file.name)},
              ${asString(file.type)},
              ${Number(file.size) || 0}
            )
          RETURNING *;
        `;
        orderFiles.push({ ...row, url: file.url });
      }
    });
  } catch (e) {
    console.error("[orders] db error", e);
    return json(res, 500, { ok: false, error: "Database error" });
  }

  // 4️⃣ Email (best-effort)
  sendOrderEmailIfConfigured(orderRow, orderItems, orderFiles);

  return json(res, 200, {
    ok: true,
    order_id: orderRow.id
  });
}
