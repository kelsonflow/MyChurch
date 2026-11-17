import type { MetadataRoute } from "next";
import { contents } from "@/lib/content";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const all = await contents();
  return [
    { url: base },
    ...["ministerios", "agenda", "mensagens", "galeria", "contactos"].map(
      (slug) => ({ url: `${base}/${slug}` }),
    ),
    ...all
      .filter(
        (c) =>
          c.kind !== "video" &&
          c.kind !== "album" &&
          c.slug !== "inicio" &&
          !c.data.hidden,
      )
      .map((c) => ({
        url: `${base}/${c.kind === "event" ? "agenda/" : c.kind === "ministry" ? "ministerios/" : ""}${c.slug}`,
        lastModified: c.updated_at,
      })),
  ];
}
