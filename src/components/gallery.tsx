"use client";
import { useRef, useState } from "react";
import { X, ArrowLeft, ArrowRight, Expand } from "lucide-react";
import { Photo } from "./content-view";
type Item = { image: string; alt: string; caption: string };
export function Gallery({ images }: { images: Item[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const current = images[index];
  return (
    <>
      <div className="gallery-grid">
        {images.map((item, i) => (
          <button
            className="gallery-item"
            key={`${item.image}-${i}`}
            onClick={() => {
              setIndex(i);
              dialog.current?.showModal();
            }}
            aria-label={`Ampliar: ${item.alt}`}
          >
            <Photo id={item.image} alt={item.alt} />
            <span>
              {item.caption}
              <Expand size={18} />
            </span>
          </button>
        ))}
      </div>
      <dialog
        className="lightbox"
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setIndex((index + 1) % images.length);
          if (e.key === "ArrowLeft")
            setIndex((index - 1 + images.length) % images.length);
        }}
      >
        {current && (
          <>
            <button
              autoFocus
              className="icon-button lightbox-close"
              aria-label="Fechar fotografia"
              onClick={() => dialog.current?.close()}
            >
              <X />
            </button>
            <Photo id={current.image} alt={current.alt} />
            <div className="lightbox-controls">
              <button
                className="icon-button"
                aria-label="Fotografia anterior"
                onClick={() =>
                  setIndex((index - 1 + images.length) % images.length)
                }
              >
                <ArrowLeft />
              </button>
              <p>
                {current.caption} · {index + 1}/{images.length}
              </p>
              <button
                className="icon-button"
                aria-label="Fotografia seguinte"
                onClick={() => setIndex((index + 1) % images.length)}
              >
                <ArrowRight />
              </button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
