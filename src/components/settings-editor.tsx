"use client";
import { useState, useTransition } from "react";
import { saveSettings, type ActionResult } from "@/app/admin/actions";
import type { Settings, Media } from "@/lib/model";
export function SettingsEditor({
  initial,
  media,
}: {
  initial: Settings;
  media: Media[];
}) {
  const [data, setData] = useState(initial);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const field = (key: keyof Settings, label: string, type = "text") => (
    <label className="field">
      {label}
      <input
        type={type}
        value={String(data[key])}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setResult(await saveSettings(data)));
      }}
      className="form-stack"
    >
      <section className="admin-panel form-stack">
        <h2>Identidade e contactos</h2>
        {field("name", "Nome da igreja")}
        {field("tagline", "Frase de identidade / rodapé")}
        {field("contactTitle", "Título do convite de contacto")}
        {field("contactText", "Texto do convite de contacto")}
        <label className="field">
          Logótipo
          <select
            value={data.logo}
            onChange={(e) => setData({ ...data, logo: e.target.value })}
          >
            <option value="">Marca tipográfica padrão</option>
            {media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.alt}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          {field("email", "Email institucional", "email")}
          {field("phone", "Telefone")}
        </div>
        {field("address", "Morada completa")}
        {field("map", "Ligação para direções (HTTPS)", "url")}
        <label className="field">
          Horários dos cultos
          <textarea
            value={data.schedule}
            onChange={(e) => setData({ ...data, schedule: e.target.value })}
          />
          <small>
            Um horário por linha. Publique apenas informações confirmadas.
          </small>
        </label>
      </section>
      <section className="admin-panel form-stack">
        <h2>Ligações e presença online</h2>
        {field("whatsapp", "WhatsApp — indicativo e número, apenas algarismos")}
        {field("instagram", "Instagram (HTTPS)", "url")}
        {field("facebook", "Facebook (HTTPS)", "url")}
        {field("youtube", "Canal do YouTube (HTTPS)", "url")}
        {field("seoDescription", "Descrição geral para motores de pesquisa")}
        <label className="checkbox">
          <input
            type="checkbox"
            checked={data.confirmed}
            onChange={(e) => setData({ ...data, confirmed: e.target.checked })}
          />
          Os contactos, dados institucionais e política de privacidade foram
          validados pela igreja.
        </label>
        <p className="form-note">
          A confirmação ativa o formulário de contacto. A responsabilidade pelo
          tratamento e os prazos de conservação devem estar preenchidos na
          página de privacidade.
        </p>
      </section>
      <div className="admin-actions">
        <button className="button primary" disabled={pending}>
          {pending ? "A guardar…" : "Guardar configurações"}
        </button>
        <div aria-live="polite">
          {result.message && (
            <p className={`notice ${result.ok ? "" : "error"}`}>
              {result.message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
