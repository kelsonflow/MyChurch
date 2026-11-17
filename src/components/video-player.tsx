"use client";
import { useState } from "react";
import { Play, ShieldCheck, X } from "lucide-react";
import { youtubeId } from "@/lib/model";
export function VideoPlayer({ url, title }: { url: string; title: string }) {
  const [consent, setConsent] = useState(false);
  const id = youtubeId(url);
  if (!id) return <p>Vídeo indisponível.</p>;
  return (
    <div className="video-wrap">
      {consent ? (
        <>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <button className="video-close" onClick={() => setConsent(false)}>
            <X size={16} /> Fechar vídeo e retirar consentimento
          </button>
        </>
      ) : (
        <div className="video-consent">
          <button
            className="play-button"
            onClick={() => setConsent(true)}
            aria-label={`Autorizar YouTube e reproduzir ${title}`}
          >
            <Play fill="currentColor" />
          </button>
          <h3>{title}</h3>
          <p>
            <ShieldCheck size={16} /> Ao carregar, autoriza a ligação ao
            YouTube.
          </p>
          <small>
            O serviço externo poderá recolher dados. A escolha vale apenas para
            este leitor.
          </small>
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacidade do fornecedor
          </a>
        </div>
      )}
    </div>
  );
}
