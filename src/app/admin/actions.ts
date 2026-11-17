"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, staff, serviceDb } from "@/lib/supabase";
import {
  contentSchema,
  settingsSchema,
  lisbonToUtc,
  youtubeId,
} from "@/lib/model";
export type ActionResult = { ok?: boolean; message?: string; id?: string };
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "Não foi possível concluir a operação.";
const base = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export async function login(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const s = await db();
    const { error } = await s.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error)
      return {
        message:
          "Email ou palavra-passe inválidos. Tente novamente mais tarde se atingir o limite de tentativas.",
      };
    try {
      await staff();
    } catch {
      await s.auth.signOut();
      return { message: "Este utilizador não tem um acesso ativo." };
    }
  } catch {
    return { message: "O acesso ainda não está configurado." };
  }
  redirect("/admin");
}
export async function logout() {
  const s = await db();
  await s.auth.signOut();
  redirect("/admin/login");
}
export async function resetPassword(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const email = z.email().parse(form.get("email"));
    const s = await db();
    await s.auth.resetPasswordForEmail(email, {
      redirectTo: `${base()}/auth/confirm`,
    });
    return {
      ok: true,
      message:
        "Se existir um acesso associado a este email, receberá uma ligação para recuperar a palavra-passe.",
    };
  } catch {
    return { message: "Verifique o email ou a configuração do serviço." };
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
    const { supabase } = await staff();
    const { error } = await supabase.auth.updateUser({ password });
    if (error)
      return {
        message:
          "Não foi possível guardar a palavra-passe. Peça uma nova ligação se a sessão expirou.",
      };
  } catch {
    return {
      message:
        "A sessão expirou ou a palavra-passe tem menos de 12 caracteres.",
    };
  }
  redirect("/admin");
}
export async function saveContent(
  input: unknown,
  id?: string,
): Promise<ActionResult> {
  try {
    const { supabase } = await staff();
    const parsed = contentSchema.safeParse(input);
    if (!parsed.success)
      return { message: parsed.error.issues.map((i) => i.message).join(" ") };
    const c = parsed.data;
    if (c.kind === "video")
      c.data.youtube = `https://www.youtube.com/watch?v=${youtubeId(c.data.youtube!)}`;
    const row = {
      ...c,
      starts_at: c.kind === "event" ? lisbonToUtc(c.data.start!) : null,
      ends_at: c.kind === "event" ? lisbonToUtc(c.data.end!) : null,
    };
    const q = id
      ? supabase.from("content").update(row).eq("id", z.uuid().parse(id))
      : supabase.from("content").insert(row);
    const { data, error } = await q.select("id").single();
    if (error)
      throw new Error(
        error.message.includes("duplicate")
          ? "Este endereço já existe. Escolha outro."
          : error.message,
      );
    revalidatePath("/", "layout");
    return {
      ok: true,
      message:
        c.status === "published"
          ? "Conteúdo publicado. O site já está atualizado."
          : "Conteúdo guardado.",
      id: data.id,
    };
  } catch (e) {
    return { message: errorText(e) };
  }
}
export async function restoreVersion(id: number): Promise<ActionResult> {
  try {
    const { supabase } = await staff();
    const { data, error } = await supabase.rpc("restore_revision", {
      revision_id: id,
    });
    if (error) throw error;
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Versão recuperada como rascunho. Reveja antes de publicar.",
      id: data,
    };
  } catch {
    return { message: "Não foi possível recuperar a versão." };
  }
}
export async function saveSettings(input: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await staff(true);
    const data = settingsSchema.parse(input);
    const { error } = await supabase
      .from("settings")
      .update({ data })
      .eq("id", 1);
    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Configurações guardadas." };
  } catch (e) {
    return { message: errorText(e) };
  }
}
export async function inviteUser(
  _: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  try {
    const { supabase } = await staff(true);
    const email = z.email().parse(form.get("email"));
    const role = z.enum(["admin", "editor"]).parse(form.get("role"));
    const service = serviceDb();
    const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${base()}/auth/confirm`,
    });
    if (error || !data.user)
      return {
        message:
          "Não foi possível enviar o convite. Verifique o SMTP e se o email já tem acesso.",
      };
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, email, role, status: "active" });
    if (profileError) {
      await service.auth.admin.deleteUser(data.user.id);
      throw new Error(
        "Não foi possível atribuir o acesso. Convite invalidado.",
      );
    }
    revalidatePath("/admin/utilizadores");
    return {
      ok: true,
      message:
        "Convite enviado por email. A ligação é de utilização única e tem a validade definida no Supabase.",
    };
  } catch (e) {
    return { message: errorText(e) };
  }
}
export async function updateAccess(
  id: string,
  role: string,
  status: string,
  revoke = false,
): Promise<ActionResult> {
  try {
    const { supabase } = await staff(true);
    z.uuid().parse(id);
    z.enum(["admin", "editor"]).parse(role);
    z.enum(["active", "suspended"]).parse(status);
    const q = revoke
      ? supabase.from("profiles").delete().eq("id", id)
      : supabase.from("profiles").update({ role, status }).eq("id", id);
    const { error } = await q;
    if (error) throw new Error(error.message);
    if (revoke) {
      const { error: authError } = await serviceDb().auth.admin.deleteUser(id);
      if (authError)
        return {
          ok: true,
          message:
            "Acesso revogado e sessões invalidadas. Remova o registo Auth residual no Supabase.",
        };
    }
    revalidatePath("/admin/utilizadores");
    return {
      ok: true,
      message: "Acesso atualizado. As sessões anteriores foram invalidadas.",
    };
  } catch (e) {
    return { message: errorText(e) };
  }
}
export async function updateMedia(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const { supabase } = await staff();
    const data = z
      .object({
        alt: z.string().min(1).max(300),
        caption: z.string().max(500),
        focal_x: z.coerce.number().int().min(0).max(100),
        focal_y: z.coerce.number().int().min(0).max(100),
      })
      .parse(input);
    const { error } = await supabase
      .from("media")
      .update(data)
      .eq("id", z.uuid().parse(id));
    if (error) throw error;
    revalidatePath("/", "layout");
    return { ok: true, message: "Imagem atualizada." };
  } catch {
    return {
      message: "Verifique o texto alternativo e o ponto focal (0–100).",
    };
  }
}
export async function deleteMedia(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await staff();
    z.uuid().parse(id);
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error)
      return {
        message:
          "Imagem em utilização. Remova primeiro as referências nos conteúdos, incluindo rascunhos.",
      };
    const { error: storageError } = await serviceDb()
      .storage.from("media")
      .remove([`${id}/small.webp`, `${id}/large.webp`]);
    revalidatePath("/admin/imagens");
    return {
      ok: true,
      message: storageError
        ? "Registo eliminado. Limpe os ficheiros órfãos no armazenamento."
        : "Imagem eliminada.",
    };
  } catch {
    return { message: "Não foi possível eliminar a imagem." };
  }
}
export async function deleteMessage(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await staff(true);
    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", z.uuid().parse(id));
    if (error) throw error;
    revalidatePath("/admin/mensagens");
    return { ok: true, message: "Mensagem eliminada." };
  } catch {
    return { message: "Não foi possível eliminar a mensagem." };
  }
}
