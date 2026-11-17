import { randomUUID } from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import type { Transaction, DocumentReference } from "firebase-admin/firestore";
import { firestore } from "./firebase-admin";
import { nextAdmins, type Profile, type Role } from "./access";
import {
  contentSchema,
  settingsSchema,
  lisbonToUtc,
  youtubeId,
  type Content,
  type Kind,
  type Media,
  type Settings,
} from "./model";
import { defaultSettings } from "./demo";
export async function listRecords<T = any>(collection: string) {
  const s = await firestore().collection(collection).get();
  return s.docs.map((d) => ({ ...d.data(), id: d.id }) as T);
}
export async function getRecord<T = any>(
  collection: string,
  id: string,
): Promise<T | undefined> {
  const s = await firestore().collection(collection).doc(id).get();
  return s.exists ? ({ ...s.data(), id: s.id } as T) : undefined;
}
export async function publishedContent(kind?: Kind) {
  const s = await firestore()
    .collection("content")
    .where("status", "==", "published")
    .get();
  return s.docs
    .map((d) => ({ ...d.data(), id: d.id }) as Content)
    .filter((c) => !kind || c.kind === kind)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}
export async function readSettings(): Promise<Settings> {
  const s = await firestore().doc("settings/general").get();
  return { ...defaultSettings, ...s.data()?.data };
}
const audit = (
  tx: Transaction,
  actor: string,
  action: string,
  entity_id: string,
) =>
  tx.create(firestore().collection("audit_log").doc(), {
    actor,
    action,
    entity_id,
    created_at: new Date().toISOString(),
  });
export function imageRefs(data: Record<string, any>) {
  return [
    ...new Set(
      [data.image, ...(data.images || []).map((v: any) => v.image)].filter(
        (v) => typeof v === "string" && /^[0-9a-f-]{36}$/.test(v),
      ),
    ),
  ] as string[];
}
export async function writeContent(
  input: unknown,
  actor: string,
  id: string = randomUUID(),
) {
  const c = contentSchema.parse(input);
  if (c.kind === "video")
    c.data.youtube = `https://www.youtube.com/watch?v=${youtubeId(c.data.youtube!)}`;
  const db = firestore();
  const ref = db.doc(`content/${id}`);
  const slug = db.doc(`slugs/${c.kind}-${c.slug}`);
  await db.runTransaction(async (tx) => {
    const [old, existingSlug] = await tx.getAll(ref, slug);
    if (existingSlug.exists && existingSlug.get("id") !== id)
      throw new Error("Este endereço já existe. Escolha outro.");
    const previous = old.data() as Content | undefined;
    const ids = [
      ...new Set([...imageRefs(previous?.data || {}), ...imageRefs(c.data)]),
    ];
    const media = ids.length
      ? await tx.getAll(...ids.map((v) => db.doc(`media/${v}`)))
      : [];
    if (media.some((m) => !m.exists))
      throw new Error("Selecione uma imagem existente na biblioteca.");
    const now = new Date().toISOString();
    if (previous) {
      tx.create(db.collection("revisions").doc(), {
        content_id: id,
        snapshot: previous,
        author: previous.updated_by || null,
        created_at: now,
      });
      if (previous.slug !== c.slug || previous.kind !== c.kind)
        tx.delete(db.doc(`slugs/${previous.kind}-${previous.slug}`));
    }
    tx.set(ref, {
      ...c,
      starts_at: c.kind === "event" ? lisbonToUtc(c.data.start!) : null,
      ends_at: c.kind === "event" ? lisbonToUtc(c.data.end!) : null,
      updated_at: now,
      updated_by: actor,
    });
    tx.set(slug, { id });
    const newRefs = imageRefs(c.data);
    media.forEach((m) => {
      const used = (m.get("usedBy") || []).filter((v: string) => v !== id);
      const published = (m.get("publishedBy") || []).filter(
        (v: string) => v !== id,
      );
      if (newRefs.includes(m.id)) {
        used.push(id);
        if (c.status === "published") published.push(id);
      }
      tx.update(m.ref, { usedBy: used, publishedBy: published });
    });
    audit(tx, actor, previous ? "content_update" : "content_create", id);
  });
  return id;
}
export async function restoreContent(revisionId: string, actor: string) {
  const r = await getRecord<any>("revisions", revisionId);
  if (!r) throw new Error("Versão não encontrada.");
  return writeContent({ ...r.snapshot, status: "draft" }, actor, r.content_id);
}
export async function writeSettings(input: unknown, actor: string) {
  const data = settingsSchema.parse(input);
  const db = firestore();
  await db.runTransaction(async (tx) => {
    const old = await tx.get(db.doc("settings/general"));
    const previous = old.get("data.logo");
    const ids = [
      ...new Set(
        [previous, data.logo].filter((v) => v && /^[0-9a-f-]{36}$/.test(v)),
      ),
    ];
    const media = ids.length
      ? await tx.getAll(...ids.map((id) => db.doc(`media/${id}`)))
      : [];
    if (media.some((m) => !m.exists)) throw new Error("Logótipo indisponível.");
    media.forEach((m) => tx.update(m.ref, { logo: m.id === data.logo }));
    tx.set(db.doc("settings/general"), { data });
    audit(tx, actor, "settings_update", "general");
  });
}
export async function writeProfile(
  profile: Omit<Profile, "version" | "created_at">,
  actor: string,
  revoke = false,
  bootstrap = false,
) {
  const db = firestore();
  await db.runTransaction(async (tx) => {
    const lockRef = db.doc("system/access");
    const pRef = db.doc(`profiles/${profile.id}`);
    const [lock, old] = await tx.getAll(lockRef, pRef);
    const admins = lock.get("admins") || [];
    if (bootstrap && admins.length)
      throw new Error("Já existe um administrador ativo. Use o painel.");
    const next = nextAdmins(
      admins,
      profile.id,
      profile.role,
      profile.status,
      revoke,
    );
    tx.set(lockRef, { admins: next });
    if (revoke) tx.delete(pRef);
    else
      tx.set(pRef, {
        ...profile,
        version: (old.get("version") || 0) + 1,
        created_at: old.get("created_at") || new Date().toISOString(),
      });
    audit(tx, actor, revoke ? "access_revoked" : "access_updated", profile.id);
  });
}
export async function mediaVisible(id: string, isStaff = false) {
  const m = await getRecord<Media & { publishedBy?: string[]; logo?: boolean }>(
    "media",
    id,
  );
  return m && (isStaff || m.logo || m.publishedBy?.length) ? m : undefined;
}
export async function removeMedia(id: string, actor: string) {
  const db = firestore();
  await db.runTransaction(async (tx) => {
    const ref = db.doc(`media/${id}`);
    const m = await tx.get(ref);
    if (!m.exists) throw new Error("Imagem não encontrada.");
    if (m.get("usedBy")?.length || m.get("logo"))
      throw new Error(
        "Esta imagem está em utilização. Remova as referências primeiro.",
      );
    tx.delete(ref);
    audit(tx, actor, "media_deleted", id);
  });
}
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const ref = firestore().doc(`rate_limits/${key}`);
  await firestore().runTransaction(async (tx) => {
    const s = await tx.get(ref);
    const active = s.exists && s.get("until") > Date.now();
    const hits = active ? s.get("hits") + 1 : 1;
    if (hits > limit)
      throw new Error("Limite de tentativas atingido. Tente mais tarde.");
    const until = active ? s.get("until") : Date.now() + windowMs;
    tx.set(ref, { hits, until, expiresAt: Timestamp.fromMillis(until) });
  });
}
