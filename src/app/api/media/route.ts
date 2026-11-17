import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { staff } from "@/lib/firebase";
import { firestore, bucket } from "@/lib/firebase-admin";
import { limitedBody } from "@/lib/request-body";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (
    req.headers.get("origin") !==
    new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").origin
  )
    return Response.json({ message: "Origem inválida." }, { status: 403 });
  try {
    await staff();
    const body = await limitedBody(req, 11 * 1024 * 1024);
    const form = await new Response(new Uint8Array(body), {
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
    const bytes = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(bytes, {
      limitInputPixels: 40000000,
      animated: false,
    }).metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) > 1
    )
      return Response.json(
        { message: "Apenas JPEG, PNG e WebP estáticos são permitidos." },
        { status: 400 },
      );
    const id = randomUUID();
    const uploaded: string[] = [];
    try {
      for (const [size, width] of [
        ["small", 640],
        ["large", 1600],
      ] as const) {
        const output = await sharp(bytes, { limitInputPixels: 40000000 })
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
        const path = `media/${id}/${size}.webp`;
        await bucket()
          .file(path)
          .save(output, {
            resumable: false,
            metadata: {
              contentType: "image/webp",
              cacheControl: "private, no-store",
            },
          });
        uploaded.push(path);
      }
      await firestore()
        .doc(`media/${id}`)
        .create({
          alt,
          caption: String(form.get("caption") || "").slice(0, 500),
          focal_x: 50,
          focal_y: 50,
          usedBy: [],
          publishedBy: [],
          logo: false,
          created_at: new Date().toISOString(),
        });
    } catch {
      await Promise.all(
        uploaded.map((p) => bucket().file(p).delete({ ignoreNotFound: true })),
      );
      throw new Error("Falha ao guardar.");
    }
    return Response.json({
      message: "Imagem carregada e otimizada no Cloud Storage.",
      id,
    });
  } catch {
    return Response.json(
      {
        message:
          "Acesso inválido, imagem não suportada ou falha no Cloud Storage.",
      },
      { status: 400 },
    );
  }
}
