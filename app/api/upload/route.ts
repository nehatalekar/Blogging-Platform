import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

function decodeBase64(data: string) {
  const normalized = data.includes(",") ? data.split(",").pop() ?? "" : data;
  return Buffer.from(normalized, "base64");
}

export async function POST(req: Request) {
  const body = await req.json();
  const { filename, data } = body;
  if (!filename || !data) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const safeFilename = `${Date.now()}-${sanitizeFilename(filename)}`;
  const buffer = decodeBase64(data);

  if (process.env.NODE_ENV === "production") {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "BLOB_READ_WRITE_TOKEN is required for production uploads" },
        { status: 500 }
      );
    }

    const blob = await put(safeFilename, buffer, {
      access: "public",
      token,
      addRandomSuffix: true,
    });

    return NextResponse.json({ ok: true, path: blob.url });
  }

  const uploads = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });

  const filePath = path.join(uploads, safeFilename);
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({ ok: true, path: `uploads/${safeFilename}` });
}
