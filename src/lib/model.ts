import { z } from "zod";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
export const kinds = ["page", "event", "video", "ministry", "album"] as const;
export type Kind = (typeof kinds)[number];
export const labels: Record<Kind, string> = {
  page: "Páginas",
  event: "Eventos",
  video: "Mensagens",
  ministry: "Ministérios",
  album: "Álbuns",
};
export type Content = {
  id: string;
  kind: Kind;
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  data: Record<string, any>;
  updated_at: string;
  updated_by?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
};
export type Media = {
  id: string;
  alt: string;
  caption: string;
  focal_x: number;
  focal_y: number;
  created_at: string;
};
export const safeUrl = z.union([
  z.literal(""),
  z.url().refine((v) => /^https:\/\//.test(v), "Use uma ligação HTTPS."),
]);
const paragraph = z.string().max(20000);
const photo = z.string().max(160);
export const contentSchema = z
  .object({
    kind: z.enum(kinds),
    title: z.string().min(2).max(160),
    slug: z
      .string()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    status: z.enum(["draft", "published", "archived"]),
    data: z.object({
      eyebrow: z.string().max(100).optional(),
      subtitle: z.string().max(600).optional(),
      body: paragraph.optional(),
      image: photo.optional(),
      category: z.string().max(80).optional(),
      location: z.string().max(300).optional(),
      schedule: z.string().max(2000).optional(),
      contact: z.union([z.literal(""), z.email()]).optional(),
      contactAuthorized: z.boolean().optional(),
      start: z.string().optional(),
      end: z.string().optional(),
      eventState: z.enum(["scheduled", "cancelled", "postponed"]).optional(),
      registration: safeUrl.optional(),
      youtube: z.string().max(300).optional(),
      preacher: z.string().max(100).optional(),
      date: z.string().optional(),
      featured: z.boolean().optional(),
      demo: z.boolean().optional(),
      hidden: z.boolean().optional(),
      homeSections: z
        .record(
          z.enum([
            "intro",
            "visit",
            "events",
            "messages",
            "ministries",
            "gallery",
          ]),
          z.object({
            eyebrow: z.string().max(100),
            title: z.string().max(200),
            body: paragraph,
            hidden: z.boolean(),
          }),
        )
        .optional(),
      sections: z
        .array(
          z.object({
            title: z.string().max(160),
            body: paragraph,
            hidden: z.boolean().optional(),
          }),
        )
        .max(30)
        .optional(),
      images: z
        .array(
          z.object({
            image: photo,
            alt: z.string().min(1).max(300),
            caption: z.string().max(500),
          }),
        )
        .max(60)
        .optional(),
    }),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "event") {
      const start = lisbonToUtc(v.data.start || "");
      const end = lisbonToUtc(v.data.end || "");
      if (!start || !end || end < start)
        ctx.addIssue({
          code: "custom",
          message:
            "Defina início e fim válidos; o fim deve ser posterior ao início.",
          path: ["data", "end"],
        });
    }
    if (v.kind === "video" && !youtubeId(v.data.youtube || ""))
      ctx.addIssue({
        code: "custom",
        message: "Ligação do YouTube inválida.",
        path: ["data", "youtube"],
      });
    if (v.kind === "video" && !/^\d{4}-\d{2}-\d{2}$/.test(v.data.date || ""))
      ctx.addIssue({
        code: "custom",
        message: "Indique a data da mensagem.",
        path: ["data", "date"],
      });
  });
export function youtubeId(value: string): string | null {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password || u.port)
      return null;
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(u.hostname)
    )
      id =
        u.pathname === "/watch"
          ? u.searchParams.get("v")
          : /^\/(?:shorts|embed)\/([^/]+)$/.exec(u.pathname)?.[1] || null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function lisbonToUtc(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  try {
    const d = fromZonedTime(value, "Europe/Lisbon");
    if (formatInTimeZone(d, "Europe/Lisbon", "yyyy-MM-dd'T'HH:mm") !== value)
      return null;
    return d.toISOString();
  } catch {
    return null;
  }
}
export function dateLabel(value: string, time = false) {
  try {
    return new Intl.DateTimeFormat("pt-PT", {
      dateStyle: "long",
      ...(time ? { timeStyle: "short" as const } : {}),
      timeZone: "Europe/Lisbon",
    }).format(new Date(value));
  } catch {
    return "Data a confirmar";
  }
}
export function eventIsUpcoming(c: Content, now = new Date()) {
  return (
    c.kind === "event" &&
    new Date(c.ends_at || c.data.end).getTime() >= now.getTime()
  );
}
export function imageUrl(id?: string, size = "large") {
  if (!id) return "/images/community.webp";
  return id.startsWith("/images/")
    ? id
    : `/media/${encodeURIComponent(id)}/${size}`;
}
export const settingsSchema = z.object({
  name: z.string().min(2).max(160),
  email: z.union([z.literal(""), z.email()]),
  phone: z.string().max(50),
  address: z.string().max(300),
  schedule: z.string().max(2000),
  map: safeUrl,
  whatsapp: z.string().regex(/^(?:\d{7,15})?$/),
  instagram: safeUrl,
  facebook: safeUrl,
  youtube: safeUrl,
  logo: z.string().max(160),
  seoDescription: z.string().max(300),
  contactTitle: z.string().max(150),
  contactText: z.string().max(500),
  tagline: z.string().max(200),
  confirmed: z.boolean(),
});
export type Settings = z.infer<typeof settingsSchema>;
