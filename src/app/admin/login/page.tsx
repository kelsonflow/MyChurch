import Link from "next/link";
import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
import { configured } from "@/lib/supabase";
export default function Login() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand />
        <h1>Cuidar da nossa casa.</h1>
        <p>Acesso reservado à equipa de gestão da igreja.</p>
        {configured() ? (
          <AuthForm />
        ) : (
          <p className="notice">
            O Supabase ainda não está configurado. Siga o README para ativar
            autenticação, base de dados e o primeiro administrador. Não existem
            credenciais predefinidas.
          </p>
        )}
        <div className="auth-links">
          <Link className="text-link" href="/admin/recuperar">
            Recuperar acesso
          </Link>
          <Link className="text-link" href="/">
            Voltar ao site ↗
          </Link>
        </div>
      </div>
    </main>
  );
}
