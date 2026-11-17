import { notFound } from "next/navigation";
import { content, settings } from "@/lib/content";
import { dateLabel } from "@/lib/model";
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
  const c = await content("event", slug);
  return { title: c?.title, alternates: { canonical: `/agenda/${slug}` } };
}
export default async function Event({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await content("event", slug);
  if (!c) notFound();
  const s = await settings();
  const structured =
    !c.data.demo && s.confirmed && c.data.location
      ? {
          "@context": "https://schema.org",
          "@type": "Event",
          name: c.title,
          startDate: c.starts_at,
          endDate: c.ends_at,
          eventStatus: `https://schema.org/Event${c.data.eventState === "cancelled" ? "Cancelled" : c.data.eventState === "postponed" ? "Postponed" : "Scheduled"}`,
          location: {
            "@type": "Place",
            name: c.data.location,
            address: c.data.location,
          },
          organizer: { "@type": "Organization", name: s.name },
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/agenda/${slug}`,
        }
      : null;
  return (
    <>
      {structured && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <PageIntro eyebrow={c.data.category || "AGENDA"} title={c.title} />
      <div className="container page-body detail-grid">
        <article>
          <DemoLabel show={c.data.demo} />
          <Photo className="page-photo" id={c.data.image} alt={c.title} />
          <RichText text={c.data.body} />
        </article>
        <aside className="event-details">
          <h2>O nosso encontro</h2>
          <div>
            <p className="eyebrow">INÍCIO</p>
            <p>{dateLabel(c.starts_at || c.data.start, true)}</p>
          </div>
          <div>
            <p className="eyebrow">FIM</p>
            <p>{dateLabel(c.ends_at || c.data.end, true)}</p>
          </div>
          <div>
            <p className="eyebrow">LOCAL</p>
            <p>{c.data.location || "A confirmar"}</p>
          </div>
          <div>
            <p className="eyebrow">ESTADO</p>
            <p>
              {c.data.eventState === "cancelled"
                ? "Cancelado"
                : c.data.eventState === "postponed"
                  ? "Adiado"
                  : "Agendado"}{" "}
              · Europe/Lisbon
            </p>
          </div>
          {c.data.eventState === "scheduled" && (
            <a className="button outline" href={`/api/calendar/${c.id}`}>
              Adicionar ao calendário
            </a>
          )}
          {c.data.registration && c.data.eventState === "scheduled" && (
            <a
              href={c.data.registration}
              className="button primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Inscrever-me
            </a>
          )}
        </aside>
      </div>
    </>
  );
}
