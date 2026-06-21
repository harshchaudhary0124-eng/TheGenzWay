import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

export async function GET() {
  try {
    const newspapersDir = path.join(process.cwd(), "public", "newspapers");
    const entries = await fs.readdir(newspapersDir, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => ALLOWED_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort(naturalSort)
      .map((name) => `/newspapers/${name}`);

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Failed to read /public/newspapers:", error);
    return NextResponse.json({ files: [] }, { status: 200 });
  }
}