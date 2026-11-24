"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createHmac } from "node:crypto";
import { z } from "zod";
import {
  staff,
  establishSession,
  endSession,
  identityRequest,
  sendAccessEmail,
} from "@/lib/firebase";
import { auth, firestore, bucket } from "@/lib/firebase-admin";
import {
  writeContent,
  restoreContent,
  writeSettings,
  writeProfile,
  getRecord,
  removeMedia,
  rateLimit,
} from "@/lib/store";
import type { Profile } from "@/lib/access";
export type ActionResult = { ok?: boolean; message?: string; id?: string };
const failure = (e: unknown) => ({
  message:
    e instanceof z.ZodError
      ? e.issues.map((issue) => issue.message).join(" ")
      : e instanceof Error
        ? e.message
        : "Não foi possível concluir a operação.",
});
async function authLimit(action: string, email: string) {
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0] || "unknown";
  const key = createHmac(
    "sha256",
    process.env.CONTACT_HASH_SECRET ||
      process.env.FIREBASE_PROJECT_ID ||
      "local",
  )
    .update(`${action}:${ip}:${email.toLowerCase()}`)
    .digest("hex");
  await rateLimit(key, action === "login" ? 10 : 4, 60 * 60 * 1000);
}
export async function login(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const email = z.email().parse(form.get("email"));
    const password = z.string().min(1).max(128).parse(form.get("password"));
    await authLimit("login", email);
    const result = await identityRequest("signInWithPassword", {
      email,
      password,
      returnSecureToken: true,
    });
    await establishSession(result.idToken);
  } catch {
    return {
      message:
        "Email ou palavra-passe inválidos, acesso inativo ou limite de tentativas atingido.",
    };
  }
  redirect("/admin");
}
export async function logout() {
  await endSession();
  redirect("/admin/login");
}
export async function resetPassword(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const email = z.email().parse(form.get("email"));
    await authLimit("reset", email);
    try {
      const user = await auth().getUserByEmail(email);
      const p = await getRecord<Profile>("profiles", user.uid);
      if (p?.status === "active") await sendAccessEmail(email);
    } catch {
      /* Same reply prevents enumeration. */
    }
    return {
      ok: true,
      message:
        "Se existir um acesso ativo associado a este email, receberá uma ligação pessoal para recuperar a palavra-passe.",
    };
  } catch {
    return { message: "Verifique o email ou tente novamente mais tarde." };
  }
}
export async function setPassword(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const password = z.string().min(12).max(128).parse(form.get("password"));
    if (password !== form.get("confirm"))
      return { message: "As palavras-passe não coincidem." };
    const { user } = await staff();
    await auth().updateUser(user.id, { password });
    await auth().revokeRefreshTokens(user.id);
    await endSession();
  } catch {
    return {
      message:
        "A sessão expirou ou a palavra-passe tem menos de 12 caracteres.",
    };
  }
  redirect("/admin/login");
}
export async function saveContent(
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    const { user } = await staff();
    if (id) z.uuid().parse(id);
    const result = await writeContent(input, user.id, id);
    revalidatePath("/", "layout");
    return {
      ok: true,
      id: result,
      message:
        (input as { status?: string }).status === "published"
          ? "Conteúdo guardado e publicado no site."
          : "Conteúdo guardado. Esta versão não está publicada no site.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function restoreVersion(id: string): Promise<ActionResult> {
  try {
    const { user } = await staff();
    const result = await restoreContent(id, user.id);
    revalidatePath("/", "layout");
    return {
      ok: true,
      id: result,
      message: "Versão recuperada como rascunho. Reveja antes de publicar.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { user } = await staff(true);
    await writeSettings(input, user.id);
    revalidatePath("/", "layout");
    return { ok: true, message: "Configurações guardadas." };
  } catch (e) {
    return failure(e);
  }
}
export async function inviteUser(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { user } = await staff(true);
    const email = z.email().parse(form.get("email"));
    const role = z.enum(["admin", "editor"]).parse(form.get("role"));
    const invited = await auth().createUser({ email });
    try {
      await writeProfile(
        { id: invited.uid, email, role, status: "active" },
        user.id,
      );
    } catch (e) {
      await auth().deleteUser(invited.uid);
      throw e;
    }
    try {
      await sendAccessEmail(email);
    } catch {
      return {
        message:
          "O acesso foi criado, mas o email não pôde ser enviado. O destinatário pode usar Recuperar acesso. Verifique o serviço de email do Firebase.",
      };
    }
    revalidatePath("/admin/utilizadores");
    return {
      ok: true,
      message:
        "Convite enviado pelo Firebase Authentication. A ligação para definir a palavra-passe é pessoal, temporária e de utilização única.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function updateAccess(
  id: string,
  role: string,
  status: string,
  revoke = false,
): Promise<ActionResult> {
  try {
    const { user } = await staff(true);
    z.string().min(1).max(128).parse(id);
    const r = z.enum(["admin", "editor"]).parse(role);
    const s = z.enum(["active", "suspended"]).parse(status);
    const previous = await getRecord<Profile>("profiles", id);
    if (!previous) throw new Error("Utilizador não encontrado.");
    await writeProfile({ ...previous, role: r, status: s }, user.id, revoke);
    await auth().revokeRefreshTokens(id);
    if (revoke) await auth().deleteUser(id);
    else await auth().updateUser(id, { disabled: s === "suspended" });
    revalidatePath("/admin/utilizadores");
    return {
      ok: true,
      message: "Acesso atualizado. As sessões anteriores foram invalidadas.",
    };
  } catch (e) {
    return failure(e);
  }
}
export async function updateMedia(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    await staff();
    const data = z
      .object({
        alt: z.string().min(1).max(300),
        caption: z.string().max(500),
        focal_x: z.coerce.number().int().min(0).max(100),
        focal_y: z.coerce.number().int().min(0).max(100),
      })
      .parse(input);
    await firestore()
      .doc(`media/${z.uuid().parse(id)}`)
      .update(data);
    revalidatePath("/", "layout");
    return { ok: true, message: "Imagem atualizada." };
  } catch (e) {
    return failure(e);
  }
}
export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    const { user } = await staff();
    z.uuid().parse(id);
    await removeMedia(id, user.id);
    await Promise.all(
      ["small", "large"].map((s) =>
        bucket().file(`media/${id}/${s}.webp`).delete({ ignoreNotFound: true }),
      ),
    );
    revalidatePath("/admin/imagens");
    return { ok: true, message: "Imagem eliminada." };
  } catch (e) {
    return failure(e);
  }
}
export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    await staff(true);
    await firestore()
      .doc(`messages/${z.uuid().parse(id)}`)
      .delete();
    revalidatePath("/admin/mensagens");
    return { ok: true, message: "Mensagem eliminada." };
  } catch (e) {
    return failure(e);
  }
}
