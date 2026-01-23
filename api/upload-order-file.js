export const runtime = "nodejs";

import { put } from "@vercel/blob";
import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end("Method not allowed");
    return;
  }

  const form = formidable({
    multiples: false,
    maxFileSize: 30 * 1024 * 1024 // 30MB
  });

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      console.error("[upload-order-file] parse error", err);
      res.status(400).end("Invalid form data");
      return;
    }

    const uploaded = Array.isArray(files.file)
        ? files.file[0]
        : files.file;

        if (!uploaded) {
        res.status(400).end("No file uploaded");
        return;
        }

        try {
        const buffer = fs.readFileSync(uploaded.filepath);

        const blob = await put(
            `order-quotes/${Date.now()}-${uploaded.originalFilename}`,
            buffer,
            {
            access: "public",
            contentType: uploaded.mimetype
            }
        );

        res.json({
            ok: true,
            url: blob.url,
            name: uploaded.originalFilename,
            type: uploaded.mimetype,
            size: uploaded.size
        });
        } catch (e) {
        console.error("[upload-order-file] upload error", e);
        res.status(500).end("Upload failed");
        }

  });
}
