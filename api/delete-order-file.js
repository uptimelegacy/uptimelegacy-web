export const runtime = "nodejs";

import { del } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      res.status(400).end("Missing file url");
      return;
    }

    await del(url);

    res.json({ ok: true });
  } catch (e) {
    console.error("[delete-order-file] error", e);
    // ⚠️ no bloqueamos UX si falla el delete
    res.status(500).json({ ok: false });
  }
}
