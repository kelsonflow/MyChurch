"use client";
import { useState, useTransition } from "react";
import { saveSettings, type ActionResult } from "@/app/admin/actions";
import type { Settings, Media } from "@/lib/model";
import { useRouter } from "next/navigation";
import { ImagePicker } from "./image-picker";
export function SettingsEditor({
  initial,
  media,
  homeId,
}: {
  initial: Settings;
  media: Media[];
  homeId?: string;
}) {
  const [data, setData] = useState(initial);
  const [result, setResult] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const [uploadedMedia, setUploadedMedia] = useState<Media[]>([]);
  const [uploads, setUploads] = useState(0);
  const router = useRouter();
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
        if (uploads) return;
        start(async () => {
          try {
            const response = await saveSettings(data);
            setResult(response);
            if (response.ok) router.refresh();
          } catch {
            setResult({
              message:
                "Não foi possível guardar. Verifique a ligação e tente novamente.",
            });
          }
        });
      }}
      className="form-stack"
    >
      <section className="admin-panel form-stack">
        <h2>Identidade e contactos</h2>
        {field("name", "Nome da igreja / título do site")}
        <p className="form-note">
          Este nome aparece junto ao logótipo, no cabeçalho, rodapé, painel e
          título do navegador. O logótipo e o nome são apresentados em conjunto.
        </p>
        {homeId && (
          <a className="text-link" href={`/admin/conteudos/${homeId}`}>
            Editar o título e a imagem principal da página inicial ↗
          </a>
        )}
        {field("tagline", "Frase de identidade / rodapé")}
        {field("contactTitle", "Título do convite de contacto")}
        {field("contactText", "Texto do convite de contacto")}
        <h3>Logótipo e ícone do site</h3>
        <p className="form-note">
          O logótipo escolhido aparece no cabeçalho, rodapé, painel e páginas de
          acesso. O ícone do navegador é gerado a partir da mesma imagem, sem a
          cortar. Para melhor leitura, use um PNG quadrado com fundo
          transparente.
        </p>
        <ImagePicker
          label="Logótipo da igreja"
          value={data.logo}
          media={[
            ...media,
            ...uploadedMedia.filter(
              (m) => !media.some((existing) => existing.id === m.id),
            ),
          ]}
          onChange={(logo) => setData((previous) => ({ ...previous, logo }))}
          onUploaded={(m) => setUploadedMedia((previous) => [...previous, m])}
          onBusy={(delta) => setUploads((count) => count + delta)}
        />
        <p className="form-note">
          Escolha «Sem imagem / padrão» para repor a marca original. Guarde as
          configurações para aplicar a alteração em todo o site.
        </p>
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
            checked={data.contactEnabled || data.confirmed}
            disabled={data.confirmed}
            onChange={(e) =>
              setData({ ...data, contactEnabled: e.target.checked })
            }
          />
          Receber mensagens pelo formulário de contacto.
        </label>
        <p className="form-note">
          As mensagens ficam disponíveis em Mensagens recebidas no painel.
        </p>
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
        <button className="button primary" disabled={pending || uploads > 0}>
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
