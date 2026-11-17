"use client";

import { useRef, useState } from "react";
import { imageUrl, type Media } from "@/lib/model";

export function ImagePicker({
  value,
  media,
  onChange,
  onUploaded,
  onBusy,
  label = "Imagem",
}: {
  value: string;
  media: Media[];
  onChange: (value: string) => void;
  onUploaded: (media: Media) => void;
  onBusy: (delta: number) => void;
  label?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  async function upload() {
    if (!file || !alt.trim()) {
      setError(true);
      setMessage("Escolha uma fotografia e escreva uma descrição da imagem.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(true);
      setMessage("A imagem deve ter até 10 MB.");
      return;
    }
    setBusy(true);
    onBusy(1);
    setMessage("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("alt", alt.trim());
      const response = await fetch("/api/media", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.id)
        throw new Error(
          result.message || "Não foi possível carregar a imagem.",
        );
      onUploaded({
        id: result.id,
        alt: alt.trim(),
        caption: "",
        focal_x: 50,
        focal_y: 50,
        created_at: new Date().toISOString(),
      });
      onChange(result.id);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setError(false);
      setMessage(
        "Imagem carregada e selecionada. Guarde o conteúdo para aplicar a alteração.",
      );
    } catch (e) {
      setError(true);
      setMessage(
        e instanceof Error
          ? e.message
          : "Falha no carregamento. Tente novamente.",
      );
    } finally {
      setBusy(false);
      onBusy(-1);
    }
  }
  return (
    <div className="form-stack image-picker">
      <label className="field">
        {label}
        <select
          value={value || ""}
          disabled={busy}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Sem imagem / padrão</option>
          <option value="/images/community.webp">
            Arquivo institucional · community
          </option>
          <option value="/images/worship.webp">
            Arquivo institucional · worship
          </option>
          {media.map((m) => (
            <option key={m.id} value={m.id}>
              {m.alt}
            </option>
          ))}
        </select>
      </label>
      {value && (
        <img
          className="image-picker-preview"
          src={imageUrl(value, "small")}
          alt={
            media.find((m) => m.id === value)?.alt ||
            "Pré-visualização da imagem selecionada"
          }
        />
      )}
      <fieldset className="image-picker-upload" disabled={busy}>
        <legend>Carregar uma nova fotografia</legend>
        <p className="form-note">
          Escolha uma imagem do computador. JPEG, PNG ou WebP · até 10 MB.
        </p>
        <label className="field">
          Fotografia do computador
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              setMessage("");
            }}
          />
        </label>
        <label className="field">
          Descrição da imagem (texto alternativo)
          <input
            value={alt}
            maxLength={300}
            placeholder="Por exemplo: entrada da nossa igreja"
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button outline"
          onClick={upload}
          disabled={busy}
        >
          {busy ? "A carregar e otimizar…" : "Carregar e usar esta imagem"}
        </button>
      </fieldset>
      {message && (
        <p className={`notice ${error ? "error" : ""}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
