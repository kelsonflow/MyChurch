"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type Media, imageUrl } from "@/lib/model";
import {
  updateMedia,
  deleteMedia,
  type ActionResult,
} from "@/app/admin/actions";
function MediaCard({ item }: { item: Media }) {
  const [result, setResult] = useState<ActionResult>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="media-card"
      onSubmit={(e) => {
        e.preventDefault();
        const form = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          setResult(await updateMedia(item.id, form));
          router.refresh();
        });
      }}
    >
      <img
        src={imageUrl(item.id, "small")}
        alt={item.alt}
        style={{ objectPosition: `${item.focal_x}% ${item.focal_y}%` }}
      />
      <label className="field">
        Texto alternativo
        <input name="alt" defaultValue={item.alt} required maxLength={300} />
      </label>
      <label className="field">
        Legenda
        <input name="caption" defaultValue={item.caption} maxLength={500} />
      </label>
      <div className="form-grid" style={{ padding: "0 18px", gap: 10 }}>
        <label className="field">
          Foco X (%)
          <input
            name="focal_x"
            type="number"
            min={0}
            max={100}
            defaultValue={item.focal_x}
          />
        </label>
        <label className="field">
          Foco Y (%)
          <input
            name="focal_y"
            type="number"
            min={0}
            max={100}
            defaultValue={item.focal_y}
          />
        </label>
      </div>
      <code>{item.id}</code>
      <div className="admin-actions">
        <button className="button primary" disabled={pending}>
          Guardar
        </button>
        <button
          type="button"
          className="button outline"
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                "Eliminar esta imagem? As imagens utilizadas em conteúdos não podem ser eliminadas.",
              )
            )
              start(async () => {
                setResult(await deleteMedia(item.id));
                router.refresh();
              });
          }}
        >
          Eliminar
        </button>
      </div>
      {result.message && (
        <p className={`notice ${result.ok ? "" : "error"}`} role="status">
          {result.message}
        </p>
      )}
    </form>
  );
}
export function MediaManager({ media }: { media: Media[] }) {
  const [state, setState] = useState<ActionResult>({});
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <>
      <form
        className="upload-zone form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const body = new FormData(form);
          setBusy(true);
          try {
            const r = await fetch("/api/media", { method: "POST", body });
            const data = await r.json();
            setState({ ok: r.ok, message: data.message });
            if (r.ok) {
              form.reset();
              router.refresh();
            }
          } catch {
            setState({ message: "Falha no carregamento. Tente novamente." });
          }
          setBusy(false);
        }}
      >
        <h2>Partilhar uma imagem</h2>
        <p className="form-note">
          JPEG, PNG ou WebP · até 10 MB · até 40 megapíxeis. Garanta autorização
          para publicar e consentimento das pessoas retratadas.
        </p>
        <label className="field">
          Ficheiro
          <input
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </label>
        <div className="form-grid">
          <label className="field">
            Texto alternativo
            <input
              name="alt"
              maxLength={300}
              required
              placeholder="Descreva a imagem para quem não a pode ver"
            />
          </label>
          <label className="field">
            Legenda
            <input name="caption" maxLength={500} />
          </label>
        </div>
        <button className="button primary" disabled={busy}>
          {busy ? "A carregar e otimizar…" : "Carregar imagem"}
        </button>
        <div aria-live="polite">
          {state.message && (
            <p className={`notice ${state.ok ? "" : "error"}`}>
              {state.message}
            </p>
          )}
        </div>
      </form>
      <div className="media-grid">
        {media.map((m) => (
          <MediaCard key={m.id} item={m} />
        ))}
      </div>
      {!media.length && (
        <p>A biblioteca está pronta para receber as primeiras imagens.</p>
      )}
    </>
  );
}
