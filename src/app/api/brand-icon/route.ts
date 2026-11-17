import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { settings } from "@/lib/content";
import { bucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const size =
    new URL(request.url).searchParams.get("size") === "180" ? 180 : 64;
  const s = await settings();
  let source: Buffer;
  if (/^[0-9a-f-]{36}$/.test(s.logo)) {
    [source] = await bucket().file(`media/${s.logo}/small.webp`).download();
  } else if (
    ["/images/community.webp", "/images/worship.webp"].includes(s.logo)
  ) {
    source = await readFile(
      path.join(process.cwd(), "public", s.logo.slice(1)),
    );
  } else {
    source = await readFile(path.join(process.cwd(), "public/icon.svg"));
  }
  const png = await sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
