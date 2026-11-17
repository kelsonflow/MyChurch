"use client";
import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  saveContent,
  restoreVersion,
  type ActionResult,
} from "@/app/admin/actions";
import {
  type Content,
  type Kind,
  type Media,
  labels,
  youtubeId,
  dateLabel,
  imageUrl,
} from "@/lib/model";
import { VideoPlayer } from "./video-player";
import { homeDefaults, homeLabels } from "@/lib/home-sections";
import { RichText, Photo } from "./content-view";
import { Gallery } from "./gallery";
type Section = { title: string; body: string; hidden?: boolean };
export function ContentEditor({
  item,
  kind,
  media,
  revisions = [],
}: {
  item?: Content;
  kind: Kind;
  media: Media[];
  revisions?: any[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title || "");
  const [slug, setSlug] = useState(item?.slug || "");
  const [status, setStatus] = useState(item?.status || "draft");
  const [data, setData] = useState<Record<string, any>>(
    item?.data || { eventState: "scheduled", demo: false },
  );
  const [result, setResult] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const [currentId, setCurrentId] = useState(item?.id);
  const [videoPreview, setVideoPreview] = useState(false);
  const previewRef = useRef<HTMLDialogElement>(null);
  const update = (key: string, value: any) =>
    setData({ ...data, [key]: value });
  const field = (
    key: string,
    label: string,
    type = "text",
    required = false,
  ) => (
    <label className="field">
      {label}
      <input
        value={data[key] || ""}
        type={type}
        required={required}
        maxLength={type === "text" ? 300 : undefined}
        onChange={(e) => update(key, e.target.value)}
      />
    </label>
  );
  function imagePicker(value: string, onChange: (s: string) => void) {
    return (
      <label className="field">
        Imagem
        <select value={value || ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Sem imagem / padrão</option>
          {["community", "worship"].map((n) => (
            <option key={n} value={`/images/${n}.webp`}>
              Arquivo institucional · {n}
            </option>
          ))}
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {m.alt}
            </option>
          ))}
        </select>
        {value && (
          <img
            src={imageUrl(value, "small")}
            alt="Pré-visualização da imagem selecionada"
            style={{ height: 150, marginTop: 8 }}
          />
        )}
      </label>
    );
  }
  const sections: Section[] = data.sections || [];
  const homeSections = {
    ...homeDefaults,
    ...data.homeSections,
  } as typeof homeDefaults;
  const images: { image: string; alt: string; caption: string }[] =
    data.images || [];
  const save = () => {
    start(async () => {
      const res = await saveContent(
        { kind, title, slug, status, data },
        currentId,
      );
      setResult(res);
      if (res.ok && res.id) {
        setCurrentId(res.id);
        if (!currentId) router.replace(`/admin/conteudos/${res.id}`);
        router.refresh();
      }
    });
  };
  return (
    <>
      <dialog
        className="editor-preview"
        ref={previewRef}
        aria-labelledby="editor-preview-title"
      >
        <button
          type="button"
          autoFocus
          className="button outline"
          onClick={() => previewRef.current?.close()}
        >
          Fechar pré-visualização
        </button>
        <p className="eyebrow">
          PRÉ-VISUALIZAÇÃO DAS ALTERAÇÕES · AINDA NÃO GUARDADAS
        </p>
        <h1 id="editor-preview-title">{title || "Sem título"}</h1>
        <p className="lead">{data.subtitle}</p>
        {data.image && (
          <Photo className="page-photo" id={data.image} alt={title} />
        )}
        <RichText text={data.body} />
        {sections
          .filter((s) => !s.hidden)
          .map((s, i) => (
            <section key={i} className="editorial-section">
              <h2>{s.title}</h2>
              <RichText text={s.body} />
            </section>
          ))}
        {slug === "inicio" &&
          Object.entries(homeSections)
            .filter(([, v]) => !v.hidden)
            .map(([k, v]) => (
              <section className="editorial-section" key={k}>
                <p className="eyebrow">{v.eyebrow}</p>
                <h2>{v.title}</h2>
                <RichText text={v.body} />
              </section>
            ))}
        {kind === "video" && youtubeId(data.youtube || "") && (
          <VideoPlayer url={data.youtube} title={title} />
        )}{" "}
        {kind === "album" && <Gallery images={images} />}{" "}
        {kind === "event" && (
          <div className="info-panel">
            <p>
              {data.start} — {data.end} · Europe/Lisbon
            </p>
            <p>
              {data.location} · {data.eventState}
            </p>
          </div>
        )}
      </dialog>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">
            {labels[kind]} / {currentId ? "EDITAR" : "CRIAR"}
          </p>
          <h1>
            {currentId
              ? "Dar forma à nossa história."
              : "Algo novo para partilhar."}
          </h1>
        </div>
        <Link href={`/admin/conteudos?tipo=${kind}`} className="text-link">
          Voltar à listagem
        </Link>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="editor-layout">
          <div>
            <section className="admin-panel form-stack">
              <h2>Conteúdo principal</h2>
              <label className="field">
                Título
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!currentId)
                      setSlug(
                        e.target.value
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/^-|-$/g, ""),
                      );
                  }}
                  required
                  minLength={2}
                  maxLength={160}
                />
              </label>
              <label className="field">
                Endereço (slug)
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                />
                <small>
                  Use letras minúsculas, números e hífen. Os slugs inicio,
                  a-igreja, primeira-visita, privacidade e termos identificam as
                  páginas principais.
                </small>
              </label>
              {kind === "page" &&
                field("eyebrow", "Pequeno título de abertura")}
              {field("subtitle", "Subtítulo")}
              <label className="field">
                Texto principal
                <textarea
                  rows={8}
                  value={data.body || ""}
                  maxLength={20000}
                  onChange={(e) => update("body", e.target.value)}
                />
                <small>
                  Separe parágrafos com uma linha em branco. Use **texto** para
                  negrito. HTML e código não são executados.
                </small>
              </label>
              {kind !== "video" &&
                imagePicker(data.image, (v) => update("image", v))}
            </section>
            {kind === "ministry" && (
              <section className="admin-panel form-stack">
                <h2>Participar neste ministério</h2>
                {field("schedule", "Atividades e horários confirmados")}
                {field("contact", "Email institucional de contacto", "email")}
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.contactAuthorized}
                    onChange={(e) =>
                      update("contactAuthorized", e.target.checked)
                    }
                  />
                  Autorizo a publicação deste contacto institucional.
                </label>
              </section>
            )}
            {["event", "video"].includes(kind) && (
              <section className="admin-panel form-stack">
                <h2>
                  {kind === "event"
                    ? "Informações do encontro"
                    : "Informações do vídeo"}
                </h2>
                {field("category", "Categoria")}
                {kind === "event" ? (
                  <>
                    <div className="form-grid">
                      {field(
                        "start",
                        "Início · Europe/Lisbon",
                        "datetime-local",
                        true,
                      )}
                      {field(
                        "end",
                        "Fim · Europe/Lisbon",
                        "datetime-local",
                        true,
                      )}
                    </div>
                    <p className="form-note">
                      O fuso Europe/Lisbon aplica automaticamente o horário de
                      verão. Na hora repetida de outono é usada a interpretação
                      da biblioteca de fuso; confirme a hora apresentada na
                      pré-visualização.
                    </p>
                    {field("location", "Local")}
                    {field(
                      "registration",
                      "Ligação opcional de inscrição (HTTPS)",
                      "url",
                    )}
                    <label className="field">
                      Estado do evento
                      <select
                        value={data.eventState || "scheduled"}
                        onChange={(e) => update("eventState", e.target.value)}
                      >
                        <option value="scheduled">Agendado</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="postponed">Adiado</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    {field("youtube", "Ligação do YouTube", "url", true)}
                    {field("preacher", "Pregador")}
                    {field("date", "Data da mensagem", "date", true)}
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={!!data.featured}
                        onChange={(e) => update("featured", e.target.checked)}
                      />
                      Destacar mensagem
                    </label>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => setVideoPreview(!videoPreview)}
                      disabled={!youtubeId(data.youtube || "")}
                    >
                      {videoPreview ? "Fechar" : "Pré-visualizar vídeo"}
                    </button>
                    {videoPreview && (
                      <VideoPlayer url={data.youtube} title={title} />
                    )}
                  </>
                )}
              </section>
            )}
            {["page", "ministry"].includes(kind) && (
              <section className="admin-panel form-stack">
                <h2>Secções estruturadas</h2>
                {slug === "inicio" &&
                  Object.entries(homeSections).map(([key, value]) => (
                    <div key={key} className="editor-section form-stack">
                      <h3>{homeLabels[key as keyof typeof homeLabels]}</h3>
                      {(["eyebrow", "title", "body"] as const).map(
                        (fieldKey) => (
                          <label className="field" key={fieldKey}>
                            {fieldKey === "eyebrow"
                              ? "Pequeno título"
                              : fieldKey === "title"
                                ? "Título"
                                : "Texto"}
                            <textarea
                              value={value[fieldKey]}
                              maxLength={
                                fieldKey === "body"
                                  ? 20000
                                  : fieldKey === "title"
                                    ? 200
                                    : 100
                              }
                              onChange={(e) =>
                                update("homeSections", {
                                  ...homeSections,
                                  [key]: {
                                    ...value,
                                    [fieldKey]: e.target.value,
                                  },
                                })
                              }
                            />
                          </label>
                        ),
                      )}
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={value.hidden}
                          onChange={(e) =>
                            update("homeSections", {
                              ...homeSections,
                              [key]: { ...value, hidden: e.target.checked },
                            })
                          }
                        />
                        Ocultar esta secção da página inicial
                      </label>
                    </div>
                  ))}
                <p className="form-note">
                  Na página de primeira visita estas secções são apresentadas
                  como perguntas frequentes.
                </p>
                {sections.map((s, i) => (
                  <div className="editor-section" key={i}>
                    <div className="editor-section-header">
                      <b>Secção {i + 1}</b>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Remover esta secção? A alteração só é aplicada ao guardar.",
                            )
                          )
                            update(
                              "sections",
                              sections.filter((_, j) => i !== j),
                            );
                        }}
                      >
                        Remover
                      </button>
                    </div>
                    <label className="field">
                      Título
                      <input
                        value={s.title}
                        maxLength={160}
                        onChange={(e) =>
                          update(
                            "sections",
                            sections.map((v, j) =>
                              j === i ? { ...v, title: e.target.value } : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Texto
                      <textarea
                        value={s.body}
                        onChange={(e) =>
                          update(
                            "sections",
                            sections.map((v, j) =>
                              j === i ? { ...v, body: e.target.value } : v,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={!!s.hidden}
                        onChange={(e) =>
                          update(
                            "sections",
                            sections.map((v, j) =>
                              j === i ? { ...v, hidden: e.target.checked } : v,
                            ),
                          )
                        }
                      />
                      Ocultar secção
                    </label>
                  </div>
                ))}
                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    update("sections", [...sections, { title: "", body: "" }])
                  }
                >
                  + Adicionar secção
                </button>
              </section>
            )}
            {kind === "album" && (
              <section className="admin-panel form-stack">
                <h2>Fotografias do álbum</h2>
                {images.map((p, i) => (
                  <div className="editor-section" key={i}>
                    {imagePicker(p.image, (v) =>
                      update(
                        "images",
                        images.map((a, j) =>
                          j === i ? { ...a, image: v } : a,
                        ),
                      ),
                    )}
                    <label className="field">
                      Texto alternativo
                      <input
                        value={p.alt}
                        required
                        maxLength={300}
                        onChange={(e) =>
                          update(
                            "images",
                            images.map((a, j) =>
                              j === i ? { ...a, alt: e.target.value } : a,
                            ),
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      Legenda
                      <input
                        value={p.caption}
                        maxLength={500}
                        onChange={(e) =>
                          update(
                            "images",
                            images.map((a, j) =>
                              j === i ? { ...a, caption: e.target.value } : a,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="button outline"
                      onClick={() => {
                        if (confirm("Remover esta fotografia do álbum?"))
                          update(
                            "images",
                            images.filter((_, j) => i !== j),
                          );
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    update("images", [
                      ...images,
                      { image: "", alt: "", caption: "" },
                    ])
                  }
                >
                  + Adicionar fotografia
                </button>
              </section>
            )}
          </div>
          <aside className="editor-side">
            <div className="admin-panel form-stack">
              <h2>Publicação</h2>
              <label className="field">
                Visibilidade
                <select
                  value={status}
                  onChange={(e) => {
                    const next = e.target.value as Content["status"];
                    if (
                      next === "archived" &&
                      !confirm(
                        "Arquivar este conteúdo e retirá-lo do site público?",
                      )
                    )
                      return;
                    setStatus(next);
                  }}
                >
                  <option value="draft">Rascunho privado</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Arquivado</option>
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={!!data.demo}
                  onChange={(e) => update("demo", e.target.checked)}
                />
                Conteúdo de demonstração
              </label>
              {["ministry", "page"].includes(kind) && (
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={!!data.hidden}
                    onChange={(e) => update("hidden", e.target.checked)}
                  />
                  Ocultar secção / listagem
                </label>
              )}
              <button className="button primary" disabled={pending}>
                {pending
                  ? "A guardar…"
                  : status === "published"
                    ? "Guardar e publicar"
                    : "Guardar conteúdo"}
              </button>
              <button
                type="button"
                className="button outline"
                disabled={pending}
                onClick={() => previewRef.current?.showModal()}
              >
                Pré-visualizar alterações
              </button>
              {currentId && (
                <Link
                  href={`/admin/previsualizar/${currentId}`}
                  target="_blank"
                  className="text-link"
                >
                  Ver versão guardada ↗
                </Link>
              )}
              <div aria-live="polite">
                {result.message && (
                  <p className={`notice ${result.ok ? "" : "error"}`}>
                    {result.message}
                  </p>
                )}
              </div>
            </div>
            <div className="admin-panel">
              <h2>Histórico</h2>
              <p className="form-note">
                Recuperar uma versão cria um rascunho e preserva o estado atual
                no histórico.
              </p>
              {revisions.map((r) => (
                <div className="revision-row" key={r.id}>
                  <span>
                    {dateLabel(r.created_at, true)}
                    <br />
                    Autor: {r.author || "Configuração inicial"}
                  </span>
                  <button
                    type="button"
                    className="button outline"
                    disabled={pending}
                    onClick={() => {
                      if (confirm("Recuperar esta versão como rascunho?"))
                        start(async () => {
                          const res = await restoreVersion(r.id);
                          setResult(res);
                          if (res.ok) location.reload();
                        });
                    }}
                  >
                    Recuperar
                  </button>
                </div>
              ))}
              {!revisions.length && (
                <p className="form-note">
                  As versões surgem após a primeira alteração.
                </p>
              )}
            </div>
          </aside>
        </div>
      </form>
    </>
  );
}
