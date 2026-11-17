import "server-only";
import { db, configured } from "./supabase";
import { demoContent, defaultSettings } from "./demo";
import type { Content, Kind, Settings } from "./model";
import { cache } from "react";
export const contents = cache(async function contents(
  kind?: Kind,
): Promise<Content[]> {
  if (!configured()) return demoContent.filter((c) => !kind || c.kind === kind);
  const s = await db();
  let q = s
    .from("content")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error)
    throw new Error(
      "Não foi possível carregar os conteúdos. Verifique as migrations.",
    );
  return data as Content[];
});
export async function content(kind: Kind, slug: string) {
  return (await contents(kind)).find((c) => c.slug === slug);
}
export const settings = cache(async function settings(): Promise<Settings> {
  if (!configured()) return defaultSettings;
  const s = await db();
  const { data, error } = await s
    .from("settings")
    .select("data")
    .eq("id", 1)
    .single();
  if (error) throw new Error("Não foi possível carregar a configuração.");
  return { ...defaultSettings, ...data?.data };
});
