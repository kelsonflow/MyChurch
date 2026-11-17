import "server-only";
import { cache } from "react";
import { configured } from "./firebase-admin";
import { publishedContent, readSettings } from "./store";
import { demoContent, defaultSettings } from "./demo";
import type { Content, Kind, Settings } from "./model";
export const contents = cache(async (kind?: Kind): Promise<Content[]> =>
  configured()
    ? publishedContent(kind)
    : demoContent.filter((c) => !kind || c.kind === kind),
);
export async function content(kind: Kind, slug: string) {
  return (await contents(kind)).find((c) => c.slug === slug);
}
export const settings = cache(async (): Promise<Settings> =>
  configured() ? readSettings() : defaultSettings,
);
