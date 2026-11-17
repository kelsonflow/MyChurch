import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { staff, serviceDb } from "@/lib/supabase";
import { limitedBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (
    req.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin
  )
    return Response.json({ message: "Origem inválida" }, { status: 403 });
  try {
    const { supabase } = await staff();
    const storage = serviceDb().storage;
    if (Number(req.headers.get("content-length") || 0) > 11 * 1024 * 1024)
      return Response.json({ message: "Máximo: 10 MB." }, { status: 413 });
    const bounded = await limitedBody(req, 11 * 1024 * 1024);
    const form = await new Response(new Uint8Array(bounded), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (
      !(file instanceof File) ||
      file.size > 10 * 1024 * 1024 ||
      file.size < 10 ||
      !alt ||
      alt.length > 300
    )
      return Response.json(
        {
          message:
            "Indique uma imagem até 10 MB e um texto alternativo (1–300 caracteres).",
        },
        { status: 400 },
      );
    const buffer = Buffer.from(await file.arrayBuffer());
    const img = sharp(buffer, { limitInputPixels: 40000000, animated: false });
    const meta = await img.metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) > 1
    )
      return Response.json(
        {
          message:
            "Apenas JPEG, PNG ou WebP estáticos. O conteúdo real do ficheiro é verificado.",
        },
        { status: 400 },
      );
    const id = randomUUID();
    const focalX = Math.max(
      0,
      Math.min(100, Number(form.get("focal_x")) || 50),
    );
    const focalY = Math.max(
      0,
      Math.min(100, Number(form.get("focal_y")) || 50),
    );
    const uploaded: string[] = [];
    try {
      for (const [size, width] of [
        ["small", 640],
        ["large", 1600],
      ] as const) {
        const output = await sharp(buffer, { limitInputPixels: 40000000 })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const path = `${id}/${size}.webp`;
        const { error } = await storage
          .from("media")
          .upload(path, output, { contentType: "image/webp", upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }
      const { error } = await supabase.from("media").insert({
        id,
        alt,
        caption: String(form.get("caption") || "").slice(0, 500),
        focal_x: focalX,
        focal_y: focalY,
      });
      if (error) throw error;
    } catch {
      if (uploaded.length) await storage.from("media").remove(uploaded);
      return Response.json(
        {
          message:
            "Não foi possível guardar a imagem. Verifique o bucket e as permissões.",
        },
        { status: 500 },
      );
    }
    return Response.json({ message: "Imagem carregada e otimizada.", id });
  } catch {
    return Response.json(
      { message: "Acesso inválido ou ficheiro não suportado." },
      { status: 400 },
    );
  }
}
