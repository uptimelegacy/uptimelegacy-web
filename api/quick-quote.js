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

function normalizeConditions(arr) {
  const allowed = new Set(["NEW", "USED", "EXCHANGE", "REFURBISHED"]);
  const vals = Array.isArray(arr) ? arr.map((x) => String(x).toUpperCase().trim()) : [];
  return vals.filter((x) => allowed.has(x));
}

async function ensureTable(sql) {
  // Best-effort: crea tabla si no existe (no rompe deploy).
  await sql`
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
  `;
}

async function sendEmailIfConfigured(payload) {
  const quoteTo = process.env.QUOTE_TO_EMAIL;
  if (!quoteTo) return { sent: false };

  // 1) Resend (opcional)
  if (process.env.RESEND_API_KEY) {
    try {
      const from = process.env.EMAIL_FROM || "quotes@uptimelegacy.com";
      const subject = `New RFQ: ${payload.partNumber} (${payload.manufacturer})`;

      const text =
        `New RFQ received\n\n` +
        `Part number: ${payload.partNumber}\n` +
        `Manufacturer: ${payload.manufacturer}\n` +
        `Name: ${payload.name}\n` +
        `Company: ${payload.companyName}\n` +
        `Email: ${payload.email}\n` +
        `Phone: ${payload.phone}\n` +
        `Conditions: ${payload.conditions.join(", ")}\n` +
        `Quantity: ${payload.quantity}\n` +
        `Page: ${payload.pageUrl}\n` +
        `Locale: ${payload.locale}\n`;

      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [quoteTo],
          subject,
          text
        })
      });

      if (r.ok) return { sent: true, provider: "resend" };
    } catch {
      // silent
    }
  }

  // 2) SMTP via nodemailer (opcional)
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

    const from = process.env.EMAIL_FROM || user;
    const subject = `New RFQ: ${payload.partNumber} (${payload.manufacturer})`;

    const text =
      `New RFQ received\n\n` +
      `Part number: ${payload.partNumber}\n` +
      `Manufacturer: ${payload.manufacturer}\n` +
      `Name: ${payload.name}\n` +
      `Company: ${payload.companyName}\n` +
      `Email: ${payload.email}\n` +
      `Phone: ${payload.phone}\n` +
      `Conditions: ${payload.conditions.join(", ")}\n` +
      `Quantity: ${payload.quantity}\n` +
      `Page: ${payload.pageUrl}\n` +
      `Locale: ${payload.locale}\n`;

    await transporter.sendMail({
      from,
      to: quoteTo,
      subject,
      text
    });

    return { sent: true, provider: "smtp" };
  } catch {
    return { sent: false };
  }
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 200, { ok: true });
  if (req.method !== "POST") return json(res, 405, { ok: false, error: "Method not allowed" });

  let body = req.body;
  // Vercel normalmente ya parsea JSON, pero por si acaso:
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const partNumber = asString(body.partNumber);
  const manufacturer = asString(body.manufacturer);
  const name = asString(body.name);
  const companyName = asString(body.companyName);
  const phone = asString(body.phone);
  const email = asString(body.email);
  const conditions = normalizeConditions(body.conditions);
  const quantity = parseInt(body.quantity, 10);
  const termsAccepted = !!body.termsAccepted;
  const pageUrl = asString(body.pageUrl);
  const locale = asString(body.locale);

  // Validación server-side (mínima pero real)
  if (!partNumber || !manufacturer || !name || !companyName || !phone || !isEmail(email)) {
    return json(res, 400, { ok: false, error: "Invalid payload" });
  }
  if (!conditions.length) return json(res, 400, { ok: false, error: "At least one condition required" });
  if (!Number.isFinite(quantity) || quantity < 1) return json(res, 400, { ok: false, error: "Invalid quantity" });
  if (!termsAccepted) return json(res, 400, { ok: false, error: "Terms not accepted" });

  // 1) Guardar en DB si hay DATABASE_URL
  if (process.env.DATABASE_URL) {
    try {
      const sql = neon(process.env.DATABASE_URL);
      await ensureTable(sql);

      await sql`
        INSERT INTO rfq_requests
          (part_number, manufacturer, name, company_name, phone, email, conditions, quantity, terms_accepted, page_url, locale)
        VALUES
          (${partNumber}, ${manufacturer}, ${name}, ${companyName}, ${phone}, ${email}, ${conditions.join(",")}, ${quantity}, ${termsAccepted}, ${pageUrl || null}, ${locale || null});
      `;
    } catch (e) {
      console.error("RFQ DB error:", e);
      // No rompemos: seguimos (requisito)
    }
  } else {
    // 2) Sin DB: log seguro (no credentials)
    console.log("RFQ received (no DB):", {
      partNumber,
      manufacturer,
      name,
      companyName,
      email,
      quantity,
      conditions
    });
  }

  // 3) Email best-effort (no rompe si no hay credenciales)
  await sendEmailIfConfigured({
    partNumber,
    manufacturer,
    name,
    companyName,
    phone,
    email,
    conditions,
    quantity,
    termsAccepted,
    pageUrl,
    locale
  });

  return json(res, 200, { ok: true });
}
