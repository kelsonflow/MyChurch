"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

export function ChurchMap({ address }: { address: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="church-map">
      {visible ? (
        <iframe
          title={`Localização da igreja: ${address}`}
          src={`https://www.google.com/maps?q=${encodeURIComponent(`${address}, Portugal`)}&output=embed&hl=pt&z=16`}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div className="church-map-placeholder">
          <MapPin size={30} aria-hidden="true" />
          <p>{address}</p>
          <button
            className="button"
            type="button"
            onClick={() => setVisible(true)}
          >
            Ver mapa da igreja
          </button>
          <small>
            Ao abrir o mapa, será carregado conteúdo do Google Maps.
          </small>
        </div>
      )}
    </div>
  );
}
