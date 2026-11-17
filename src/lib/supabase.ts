import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export async function db() {
  const jar = await cookies();
  if (!configured())
    throw new Error("Configure o Supabase para ativar esta funcionalidade.");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Refresh handled by proxy. */
          }
        },
      },
    },
  );
}
export function serviceDb() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("Credenciais de serviço indisponíveis.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function staff(admin = false) {
  const supabase = await db();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Inicie sessão para continuar.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const { data: valid } = await supabase.rpc("is_staff");
  if (
    !profile ||
    !valid ||
    profile.status !== "active" ||
    (admin && profile.role !== "admin")
  )
    throw new Error("Sem permissão para esta operação.");
  return { supabase, user, profile };
}
