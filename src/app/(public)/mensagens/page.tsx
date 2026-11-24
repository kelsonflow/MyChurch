import Link from "next/link";
import { contents } from "@/lib/content";
import { dateLabel } from "@/lib/model";
import { PageIntro, Empty, DemoLabel } from "@/components/content-view";
import { VideoPlayer } from "@/components/video-player";
export const metadata = {
  title: "Mensagens",
  alternates: { canonical: "/mensagens" },
};
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const all = (await contents("video")).sort((a, b) =>
    (b.data.date || "").localeCompare(a.data.date || ""),
  );
  const list = all.filter((v) => !categoria || v.data.category === categoria);
  return (
    <>
      <PageIntro
        eyebrow="A PALAVRA PARA OS SEUS DIAS"
        title="Uma mensagem pode fazer a diferença."
        subtitle="Encontre tempo para ouvir, refletir e crescer na fé."
      />
      <section className="container page-body">
        <div className="filters">
          <Link
            href="/mensagens"
            className={`filter ${!categoria ? "active" : ""}`}
          >
            Todas
          </Link>
          {[...new Set(all.map((v) => v.data.category).filter(Boolean))].map(
            (cat) => (
              <Link
                className={`filter ${categoria === cat ? "active" : ""}`}
                key={cat}
                href={`/mensagens?categoria=${encodeURIComponent(cat)}`}
              >
                {cat}
              </Link>
            ),
          )}
        </div>
        {list.length ? (
          <div className="video-list">
            {list.map((v, i) => (
              <article key={v.id}>
                <p
                  className={`eyebrow${i > 0 ? " video-label-spacer" : ""}`}
                  aria-hidden={i > 0 ? true : undefined}
                >
                  {i === 0 ? "MENSAGEM MAIS RECENTE" : "\u00a0"}
                </p>
                <VideoPlayer url={v.data.youtube} title={v.title} />
                <h2>{v.title}</h2>
                <p className="caption">
                  {v.data.preacher && `${v.data.preacher} · `}
                  {dateLabel(v.data.date)} · {v.data.category}
                </p>
                <p>{v.data.body}</p>
                <DemoLabel show={v.data.demo} />
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="Um espaço para continuar a ouvir"
            body="Os vídeos serão publicados depois de confirmados pela equipa da igreja."
          />
        )}
      </section>
    </>
  );
}
