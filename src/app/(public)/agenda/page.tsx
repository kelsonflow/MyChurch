import Link from "next/link";
import { contents } from "@/lib/content";
import { eventIsUpcoming } from "@/lib/model";
import { PageIntro, EventCard, Empty } from "@/components/content-view";
export const metadata = {
  title: "Agenda",
  alternates: { canonical: "/agenda" },
};
export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; arquivo?: string }>;
}) {
  const q = await searchParams;
  const archive = q.arquivo === "1";
  const all = await contents("event");
  const items = all
    .filter((c) => eventIsUpcoming(c) !== archive)
    .filter((c) => !q.categoria || c.data.category === q.categoria)
    .sort((a, b) =>
      archive
        ? (b.starts_at || "").localeCompare(a.starts_at || "")
        : (a.starts_at || "").localeCompare(b.starts_at || ""),
    );
  const categories = [
    ...new Set(all.map((c) => c.data.category).filter(Boolean)),
  ];
  const href = (cat = "") =>
    `/agenda?${new URLSearchParams({ ...(archive ? { arquivo: "1" } : {}), ...(cat ? { categoria: cat } : {}) })}`;
  return (
    <>
      <PageIntro
        eyebrow="TEMPO DE ESTARMOS JUNTOS"
        title={
          archive ? "Memórias da comunidade." : "Encontros que nos aproximam."
        }
        subtitle={
          archive
            ? "O arquivo das atividades anteriores."
            : "Consulte a agenda e descubra o próximo encontro."
        }
      />
      <section className="container page-body">
        <div className="filters">
          <Link
            className={`filter ${!q.categoria ? "active" : ""}`}
            href={href()}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              className={`filter ${q.categoria === cat ? "active" : ""}`}
              href={href(cat)}
            >
              {cat}
            </Link>
          ))}
          <Link
            href={archive ? "/agenda" : "/agenda?arquivo=1"}
            className="archive-link"
          >
            {archive ? "Próximos eventos" : "Ver arquivo de eventos"}
          </Link>
        </div>
        {items.length ? (
          <div className="events-grid">
            {items.map((c) => (
              <EventCard key={c.id} item={c} />
            ))}
          </div>
        ) : (
          <Empty
            title="Sem eventos nesta seleção"
            body="Consulte outras categorias ou volte em breve para conhecer a programação."
          />
        )}
      </section>
    </>
  );
}
