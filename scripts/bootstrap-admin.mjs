import { createClient } from "@supabase/supabase-js";
// Run once from a trusted machine. Never expose the service key to a browser.
const email = process.argv[2];
if (!email || !email.includes("@"))
  throw new Error("Uso: npm run bootstrap -- administrador@dominio.pt");
const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const { count, error } = await s
  .from("profiles")
  .select("*", { count: "exact", head: true })
  .eq("role", "admin")
  .eq("status", "active");
if (error) throw error;
if (count)
  throw new Error(
    "Já existe um administrador. Use os convites da área privada.",
  );
const { data, error: inviteError } = await s.auth.admin.inviteUserByEmail(
  email,
  { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm` },
);
if (inviteError) throw inviteError;
const { error: profileError } = await s
  .from("profiles")
  .insert({ id: data.user.id, email, role: "admin", status: "active" });
if (profileError) {
  await s.auth.admin.deleteUser(data.user.id);
  throw profileError;
}
console.log(
  "Convite do primeiro administrador enviado. Consulte o email para definir a palavra-passe.",
);
