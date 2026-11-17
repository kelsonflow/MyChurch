"use client";
import { useActionState } from "react";
import { login, resetPassword, setPassword } from "@/app/admin/actions";
export function AuthForm({
  mode = "login",
}: {
  mode?: "login" | "reset" | "password";
}) {
  const [state, action, pending] = useActionState(
    mode === "reset"
      ? resetPassword
      : mode === "password"
        ? setPassword
        : login,
    {},
  );
  return (
    <form action={action} className="form-stack">
      {mode !== "password" && (
        <label className="field">
          Email
          <input name="email" type="email" autoComplete="email" required />
        </label>
      )}
      {mode !== "reset" && (
        <label className="field">
          {mode === "password" ? "Nova palavra-passe" : "Palavra-passe"}
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "password" ? "new-password" : "current-password"
            }
            minLength={mode === "password" ? 12 : undefined}
            maxLength={128}
            required
          />
          {mode === "password" && <small>Use pelo menos 12 caracteres.</small>}
        </label>
      )}
      {mode === "password" && (
        <label className="field">
          Confirmar palavra-passe
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
          />
        </label>
      )}
      <button className="button primary" disabled={pending}>
        {pending
          ? "A processar…"
          : mode === "reset"
            ? "Enviar ligação"
            : mode === "password"
              ? "Guardar palavra-passe"
              : "Entrar na área privada"}
      </button>
      <div aria-live="polite">
        {state.message && (
          <p className={`notice ${state.ok ? "" : "error"}`}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
