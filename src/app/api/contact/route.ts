import { createHmac } from "node:crypto";
import { z } from "zod";
import { configured, firestore } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/store";
import { settings } from "@/lib/content";
import { limitedBody } from "@/lib/request-body";
import { trustedOrigin } from "@/lib/trusted-origin";
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0),
});
export async function POST(req: Request) {
  if (!trustedOrigin(req.headers.get("origin")))
    return Response.json(
      { message: "Origem do pedido inválida." },
      { status: 403 },
    );
  if (!configured() || !process.env.CONTACT_HASH_SECRET)
    return Response.json(
      { message: "O envio ainda não está configurado." },
      { status: 503 },
    );
  if (Number(req.headers.get("content-length") || 0) > 12000)
    return Response.json(
      { message: "Mensagem demasiado longa." },
      { status: 413 },
    );
  try {
    const raw = (await limitedBody(req, 12000)).toString("utf8");
    if (Buffer.byteLength(raw) > 12000) throw new Error();
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return Response.json(
        {
          message:
            "Verifique os campos. A mensagem deve ter entre 10 e 5000 caracteres.",
        },
        { status: 400 },
      );
    const s = await settings();
    if (!s.contactEnabled && !s.confirmed)
      return Response.json(
        { message: "O formulário aguarda validação pela igreja." },
        { status: 503 },
      );
    // x-forwarded-for must be overwritten by the trusted hosting proxy (see deployment guide).
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHmac("sha256", process.env.CONTACT_HASH_SECRET)
      .update(ip)
      .digest("hex");
    try {
      await rateLimit(`contact-${key}`, 4, 60 * 60 * 1000);
    } catch {
      return Response.json(
        {
          message:
            "Não foi possível enviar ou atingiu o limite de envios. Tente mais tarde.",
        },
        { status: 429 },
      );
    }
    const { website, ...message } = parsed.data;
    await firestore()
      .collection("messages")
      .add({ ...message, created_at: new Date().toISOString() });
    if (
      process.env.RESEND_API_KEY &&
      process.env.MAIL_FROM &&
      process.env.CONTACT_NOTIFY_EMAIL
    ) {
      try {
        const result = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.MAIL_FROM,
            to: [process.env.CONTACT_NOTIFY_EMAIL],
            subject: "Nova mensagem no site da igreja",
            text: "Recebeu uma nova mensagem. Consulte-a na área privada do site. Por privacidade, não incluímos dados pessoais neste aviso.",
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (!result.ok)
          console.error("Contact notification failed:", result.status);
      } catch {
        console.error("Contact notification unavailable");
      }
    }
    return Response.json({
      message: "Mensagem recebida. Obrigado por entrar em contacto connosco.",
    });
  } catch {
    return Response.json(
      { message: "Não foi possível enviar a mensagem. Tente novamente." },
      { status: 400 },
    );
  }
}
