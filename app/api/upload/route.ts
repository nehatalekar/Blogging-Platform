import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { filename, data } = body;
  if (!filename || !data) return NextResponse.json({ error: "invalid" }, { status: 400 });

  const uploads = path.join(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploads)) fs.mkdirSync(uploads, { recursive: true });

  const filePath = path.join(uploads, filename);
  const buffer = Buffer.from(data, "base64");
  fs.writeFileSync(filePath, buffer);

  return NextResponse.json({ ok: true, path: `uploads/${filename}` });
}
