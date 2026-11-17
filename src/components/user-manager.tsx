"use client";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteUser,
  updateAccess,
  type ActionResult,
} from "@/app/admin/actions";
type Profile = { id: string; email: string; role: string; status: string };
function UserRow({ p }: { p: Profile }) {
  const [role, setRole] = useState(p.role);
  const [status, setStatus] = useState(p.status);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <tr>
      <td>
        {p.email}
        {result.message && (
          <p className={`notice ${result.ok ? "" : "error"}`} role="status">
            {result.message}
          </p>
        )}
      </td>
      <td>
        <label className="field">
          <span className="sr-only">Perfil de {p.email}</span>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
        </label>
      </td>
      <td>
        <label className="field">
          <span className="sr-only">Estado de {p.email}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Ativo</option>
            <option value="suspended">Suspenso</option>
          </select>
        </label>
      </td>
      <td>
        <div className="admin-actions">
          <button
            className="button outline"
            disabled={pending}
            onClick={() => {
              if (
                confirm(
                  "Guardar o acesso? As sessões anteriores deste utilizador serão invalidadas.",
                )
              )
                start(async () => {
                  setResult(await updateAccess(p.id, role, status));
                  router.refresh();
                });
            }}
          >
            Guardar
          </button>
          <button
            className="button danger"
            disabled={pending}
            onClick={() => {
              if (confirm(`Revogar definitivamente o acesso de ${p.email}?`))
                start(async () => {
                  setResult(await updateAccess(p.id, role, status, true));
                  router.refresh();
                });
            }}
          >
            Revogar
          </button>
        </div>
      </td>
    </tr>
  );
}
export function UserManager({ profiles }: { profiles: Profile[] }) {
  const [state, action, pending] = useActionState(inviteUser, {});
  return (
    <>
      <form action={action} className="admin-panel form-stack">
        <h2>Convidar alguém para a equipa</h2>
        <div className="form-grid">
          <label className="field">
            Email
            <input name="email" type="email" required autoComplete="off" />
          </label>
          <label className="field">
            Perfil
            <select name="role" defaultValue="editor">
              <option value="editor">Editor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
        </div>
        <p className="form-note">
          O convite é pessoal, temporário e de utilização única. Não existe
          registo público.
        </p>
        <button className="button primary" disabled={pending}>
          {pending ? "A enviar convite…" : "Enviar convite"}
        </button>
        <div aria-live="polite">
          {state.message && (
            <p className={`notice ${state.ok ? "" : "error"}`}>
              {state.message}
            </p>
          )}
        </div>
      </form>
      <section className="admin-panel">
        <h2>Acessos à equipa</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Perfil</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <UserRow key={`${p.id}-${p.role}-${p.status}`} p={p} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
