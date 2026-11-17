import { notFound } from "next/navigation";
import { staff } from "@/lib/supabase";
import {
  PageIntro,
  Photo,
  RichText,
  DemoLabel,
} from "@/components/content-view";
import { VideoPlayer } from "@/components/video-player";
import { Gallery } from "@/components/gallery";
import { dateLabel } from "@/lib/model";
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await staff();
  const { data: c } = await supabase
    .from("content")
    .select("*")
    .eq("id", id)
    .single();
  if (!c) notFound();
  return (
    <>
      <div className="preview-label">
        Pré-visualização privada · {c.status} · visível apenas à equipa
      </div>
      <div className="draft-preview">
        <p className="eyebrow">{c.data.eyebrow || c.kind}</p>
        <h1>{c.title}</h1>
        <p className="lead">{c.data.subtitle}</p>
        <DemoLabel show={c.data.demo} />
        {c.data.image && (
          <Photo
            className="page-photo"
            id={c.data.image}
            alt="Pré-visualização"
          />
        )}
        {c.kind === "event" && (
          <div className="info-panel">
            <p>
              {dateLabel(c.starts_at, true)} — {dateLabel(c.ends_at, true)}
            </p>
            <p>
              {c.data.location} · {c.data.eventState}
            </p>
          </div>
        )}
        {c.kind === "video" && (
          <VideoPlayer url={c.data.youtube} title={c.title} />
        )}
        <RichText text={c.data.body} />
        {c.data.sections
          ?.filter((s: any) => !s.hidden)
          .map((s: any, i: number) => (
            <section key={i} className="editorial-section">
              <h2>{s.title}</h2>
              <RichText text={s.body} />
            </section>
          ))}
        {c.kind === "album" && <Gallery images={c.data.images || []} />}
      </div>
    </>
  );
}
