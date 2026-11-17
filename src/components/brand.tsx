import Link from "next/link";
import { imageUrl } from "@/lib/model";
export function Brand({
  light = false,
  name,
  logo,
}: {
  light?: boolean;
  name?: string;
  logo?: string;
}) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "brand-light" : ""}`}
      aria-label={`${name || "Missão aos Povos"} — início`}
    >
      {logo ? (
        <img
          className="brand-logo"
          src={imageUrl(logo, "small")}
          alt={name || "Missão aos Povos"}
        />
      ) : (
        <>
          <svg viewBox="0 0 44 48" fill="none" aria-hidden="true">
            <path
              d="M22 3v39M9 16h26M4 29c5 1 12 6 18 15 6-9 13-14 18-15M4 37c7 0 13 3 18 8 5-5 11-8 18-8"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span>
            {name && name !== "Assembleia de Deus — Missão aos Povos"
              ? name
              : "MISSÃO AOS POVOS"}
            <small>ASSEMBLEIA DE DEUS · PORTUGAL</small>
          </span>
        </>
      )}
    </Link>
  );
}
