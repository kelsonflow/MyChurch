import { redirect } from "next/navigation";
import { staff } from "@/lib/supabase";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export default async function Password() {
  try {
    await staff();
  } catch {
    redirect("/admin/login");
  }
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand />
        <h1>O seu acesso começa aqui.</h1>
        <p>Defina uma palavra-passe pessoal para gerir o site.</p>
        <AuthForm mode="password" />
      </div>
    </main>
  );
}
