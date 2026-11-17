import { notFound } from "next/navigation";
import Link from "next/link";
import { content } from "@/lib/content";
import {
  PageIntro,
  Photo,
  RichText,
  DemoLabel,
} from "@/components/content-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await content("ministry", slug);
  return { title: c?.title, alternates: { canonical: `/ministerios/${slug}` } };
}
export default async function Ministry({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await content("ministry", slug);
  if (!c || c.data.hidden) notFound();
  return (
    <>
      <PageIntro
        eyebrow="MINISTÉRIOS · FAZER PARTE"
        title={c.title}
        subtitle={c.data.subtitle}
      />
      <div className="container page-body">
        <DemoLabel show={c.data.demo} />
        <Photo
          className="page-photo"
          id={c.data.image}
          alt={`Arquivo da comunidade · ${c.title}`}
        />
        <div className="prose-grid">
          <RichText text={c.data.body} />
          <div>
            {c.data.sections
              ?.filter((s: any) => !s.hidden)
              .map((s: any, i: number) => (
                <section className="editorial-section" key={i}>
                  <h2>{s.title}</h2>
                  <RichText text={s.body} />
                </section>
              ))}
            {c.data.schedule && (
              <div className="info-panel">
                <h2>Atividades e horários</h2>
                <p className="preserve">{c.data.schedule}</p>
              </div>
            )}
            {c.data.contact && c.data.contactAuthorized && (
              <div className="info-panel">
                <h2>Contacto do ministério</h2>
                <a className="text-link" href={`mailto:${c.data.contact}`}>
                  {c.data.contact}
                </a>
              </div>
            )}
            <div className="info-panel">
              <h2>Quer saber mais?</h2>
              <p>
                Fale com a equipa para conhecer as atividades e como participar.
              </p>
              <Link href="/contactos" className="button primary">
                Entre em contacto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
