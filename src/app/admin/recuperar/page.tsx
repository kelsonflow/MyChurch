import { Brand } from "@/components/brand";
import { AuthForm } from "@/components/auth-form";
export default function Recover() {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Brand />
        <h1>Recuperar acesso.</h1>
        <p>Enviamos uma ligação para o email associado ao seu acesso.</p>
        <AuthForm mode="reset" />
      </div>
    </main>
  );
}
