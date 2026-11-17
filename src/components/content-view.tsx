import Link from "next/link";
import { ArrowUpRight, CalendarDays, ArrowRight } from "lucide-react";
import { dateLabel, type Content } from "@/lib/model";
export { Photo } from "./photo";
import { Photo } from "./photo";
export function DemoLabel({ show }: { show?: boolean }) {
  return show ? (
    <span className="badge">Demonstração · sujeito a validação</span>
  ) : null;
}
export function RichText({ text }: { text?: string }) {
  return (
    <div className="rich-text">
      {(text || "Informação em preparação.").split(/\n\s*\n/).map((p, i) => (
        <p key={i}>
          {p
            .split(/(\*\*[^*]+\*\*)/)
            .map((part, j) =>
              part.startsWith("**") ? (
                <strong key={j}>{part.slice(2, -2)}</strong>
              ) : (
                part
              ),
            )}
        </p>
      ))}
    </div>
  );
}
export function PageIntro({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="page-intro container">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {subtitle && <p className="lead">{subtitle}</p>}
    </div>
  );
}
export function EventCard({ item }: { item: Content }) {
  const d = new Date(item.starts_at || item.data.start);
  return (
    <article className="event-card">
      <Link href={`/agenda/${item.slug}`} tabIndex={-1} aria-hidden="true">
        <Photo id={item.data.image} alt="" />
      </Link>
      <div className="event-card-body">
        <div className="date-tile">
          <b>
            {new Intl.DateTimeFormat("pt-PT", {
              day: "2-digit",
              timeZone: "Europe/Lisbon",
            }).format(d)}
          </b>
          <span>
            {new Intl.DateTimeFormat("pt-PT", {
              month: "short",
              timeZone: "Europe/Lisbon",
            })
              .format(d)
              .replace(".", "")}
          </span>
        </div>
        <div>
          <p className="eyebrow">{item.data.category || "COMUNIDADE"}</p>
          <h3>
            <Link href={`/agenda/${item.slug}`}>
              {item.title} <ArrowUpRight size={20} />
            </Link>
          </h3>
          <p>{dateLabel(item.starts_at || item.data.start, true)}</p>
          {item.data.eventState !== "scheduled" && (
            <span className="badge">
              {item.data.eventState === "cancelled" ? "Cancelado" : "Adiado"}
            </span>
          )}
          <DemoLabel show={item.data.demo} />
        </div>
      </div>
    </article>
  );
}
export function MinistryCard({
  item,
  index = 0,
}: {
  item: Content;
  index?: number;
}) {
  return (
    <Link className="ministry-card" href={`/ministerios/${item.slug}`}>
      <span className="ministry-number">0{index + 1}</span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.data.body}</p>
      </div>
      <ArrowUpRight size={22} />
    </Link>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <CalendarDays size={32} />
      <h3>{title}</h3>
      <p>{body}</p>
      <Link href="/contactos" className="text-link">
        Fale com a equipa <ArrowRight size={16} />
      </Link>
    </div>
  );
}
