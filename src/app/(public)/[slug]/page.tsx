import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { content, settings } from "@/lib/content";
import {
  PageIntro,
  Photo,
  RichText,
  DemoLabel,
} from "@/components/content-view";
import { VisitInfo } from "@/components/site-shell";
import { ArrowUpRight } from "lucide-react";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await content("page", slug);
  return {
    title: c?.title || "Página não encontrada",
    description: c?.data.subtitle,
    alternates: { canonical: `/${slug}` },
  };
}
export default async function EditorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await content("page", slug);
  if (!c || slug === "inicio") notFound();
  const visit = slug === "primeira-visita";
  const s = await settings();
  return (
    <>
      <PageIntro
        eyebrow={c.data.eyebrow || "MISSÃO AOS POVOS"}
        title={c.title}
        subtitle={c.data.subtitle}
      />
      <div className="container page-body">
        <DemoLabel show={c.data.demo} />
        {visit && (
          <>
            <VisitInfo s={s} />
            {s.map && (
              <p>
                <a
                  className="button outline"
                  href={s.map}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Obter direções <ArrowUpRight size={16} />
                </a>
              </p>
            )}
          </>
        )}
        {c.data.image && (
          <Photo
            className="page-photo"
            id={c.data.image}
            alt="Arquivo histórico da comunidade — 2023"
          />
        )}
        <div className={c.data.sections?.length ? "prose-grid" : ""}>
          <div>
            <RichText text={c.data.body} />
            {visit && (
              <Link className="button primary" href="/contactos">
                Fale com a equipa <ArrowUpRight size={17} />
              </Link>
            )}
          </div>
          <div>
            {c.data.sections
              ?.filter((v: any) => !v.hidden)
              .map((section: any, i: number) =>
                visit ? (
                  <details className="faq" key={i}>
                    <summary>{section.title}</summary>
                    <RichText text={section.body} />
                  </details>
                ) : (
                  <section className="editorial-section" key={i}>
                    <h2>{section.title}</h2>
                    <RichText text={section.body} />
                  </section>
                ),
              )}
          </div>
        </div>
      </div>
    </>
  );
}
