"use client";
import { useEffect, useState } from "react";
import { imageUrl } from "@/lib/model";
export function Photo({
  id,
  alt,
  priority = false,
  className = "",
  focal,
}: {
  id?: string;
  alt: string;
  priority?: boolean;
  className?: string;
  focal?: string;
}) {
  const uploaded = !!id && !id.startsWith("/images/");
  const [meta, setMeta] = useState<{
    alt: string;
    focal_x: number;
    focal_y: number;
  } | null>(null);
  useEffect(() => {
    if (!uploaded) return;
    const controller = new AbortController();
    fetch(`/api/media/${id}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setMeta)
      .catch(() => {});
    return () => controller.abort();
  }, [id, uploaded]);
  return (
    <img
      className={className}
      src={imageUrl(id)}
      srcSet={
        uploaded
          ? `${imageUrl(id, "small")} 640w, ${imageUrl(id)} 1600w`
          : undefined
      }
      sizes="(max-width: 700px) 100vw, 65vw"
      alt={meta?.alt || alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      width="1600"
      height="1000"
      style={{
        objectPosition:
          focal || (meta ? `${meta.focal_x}% ${meta.focal_y}%` : "50% 50%"),
      }}
    />
  );
}
