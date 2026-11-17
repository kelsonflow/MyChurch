import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Heart,
  BookOpen,
  Users,
} from "lucide-react";
import { content, contents, settings } from "@/lib/content";
import { eventIsUpcoming } from "@/lib/model";
import {
  Photo,
  EventCard,
  MinistryCard,
  DemoLabel,
  Empty,
} from "@/components/content-view";
import { VisitInfo } from "@/components/site-shell";
import { VideoPlayer } from "@/components/video-player";
import { homeDefaults } from "@/lib/home-sections";
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const [home, about, all, s] = await Promise.all([
    content("page", "inicio"),
    content("page", "a-igreja"),
    contents(),
    settings(),
  ]);
  const events = all
    .filter((c) => eventIsUpcoming(c))
    .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""))
    .slice(0, 2);
  const ministries = all
    .filter((c) => c.kind === "ministry" && !c.data.hidden)
    .slice(0, 4);
  const videos = all
    .filter((c) => c.kind === "video")
    .sort((a, b) => (b.data.date || "").localeCompare(a.data.date || ""));
  const video = videos.find((v) => v.data.featured) || videos[0];
  const album = all.find((c) => c.kind === "album");
  const copy = {
    ...homeDefaults,
    ...home?.data.homeSections,
  } as typeof homeDefaults;
  return (
    <>
      <section className="hero">
        <Photo
          id={home?.data.image}
          alt="Encontro da comunidade — fotografia do arquivo institucional de 2023"
          priority
        />
        <div className="hero-shade" />
        <div className="container hero-content">
          <div className="hero-kicker">
            <span />{" "}
            {home?.data.eyebrow || "FÉ QUE NOS UNE. AMOR QUE NOS MOVE."}
          </div>
          <h1>{home?.title || "Uma igreja que ama, cuida e partilha."}</h1>
          <p>
            {home?.data.subtitle ||
              "Um lugar para crescer na fé, encontrar comunidade e caminhar com propósito."}
          </p>
          <div className="hero-actions">
            <Link href="/primeira-visita" className="button gold">
              Prepare a sua visita <ArrowUpRight size={18} />
            </Link>
            <Link href="#cultos" className="hero-secondary">
              Conheça os nossos cultos <ArrowRight size={18} />
            </Link>
          </div>
          <div className="hero-foot">
            <span>ASSEMBLEIA DE DEUS · PORTUGAL</span>
            <span>{s.tagline}</span>
          </div>
        </div>
        {home?.data.image?.startsWith("/images/") && (
          <span className="photo-credit">Arquivo da comunidade · 2023</span>
        )}
      </section>
      <div id="cultos" className="container visit-strip">
        <VisitInfo s={s} />
      </div>
      {!copy.intro.hidden && (
        <section className="section container intro-grid">
          <div className="intro-photo">
            <Photo
              id={about?.data.image}
              alt="A comunidade da Missão aos Povos, no arquivo institucional"
            />
            <span className="photo-note">Pessoas. Histórias. Uma só fé.</span>
          </div>
          <div className="intro-copy">
            <p className="eyebrow">{copy.intro.eyebrow}</p>
            <h2>{copy.intro.title}</h2>
            <p>{copy.intro.body}</p>
            <div className="values-line">
              <span>
                <Heart size={18} /> Acolher
              </span>
              <span>
                <BookOpen size={18} /> Crescer
              </span>
              <span>
                <Users size={18} /> Partilhar
              </span>
            </div>
            <Link className="text-link" href="/a-igreja">
              Conheça a nossa história <ArrowUpRight size={19} />
            </Link>
          </div>
        </section>
      )}
      {!copy.visit.hidden && (
        <section className="first-visit">
          <div className="container first-visit-inner">
            <div className="visit-symbol" aria-hidden="true">
              <Plus strokeWidth={0.7} />
            </div>
            <div>
              <p className="eyebrow">{copy.visit.eyebrow}</p>
              <h2>{copy.visit.title}</h2>
              <p>{copy.visit.body}</p>
            </div>
            <Link href="/primeira-visita" className="button outline-light">
              Saiba o que esperar <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      )}
      {!copy.events.hidden && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{copy.events.eyebrow}</p>
              <h2>{copy.events.title}</h2>
              {copy.events.body && <p>{copy.events.body}</p>}
            </div>
            <Link className="text-link" href="/agenda">
              Ver toda a agenda <ArrowUpRight size={18} />
            </Link>
          </div>
          {events.length ? (
            <div className="events-grid">
              {events.map((e) => (
                <EventCard key={e.id} item={e} />
              ))}
            </div>
          ) : (
            <Empty
              title="Novos encontros a caminho"
              body="A programação confirmada será publicada aqui."
            />
          )}
        </section>
      )}
      {!copy.messages.hidden && (
        <section className="message-section">
          <div className="container message-grid">
            <div>
              <p className="eyebrow">{copy.messages.eyebrow}</p>
              <h2>{copy.messages.title}</h2>
              <p>{copy.messages.body}</p>
              <Link href="/mensagens" className="text-link">
                Explorar mensagens <ArrowUpRight size={18} />
              </Link>
            </div>
            {video ? (
              <VideoPlayer url={video.data.youtube} title={video.title} />
            ) : (
              <div className="message-placeholder">
                <BookOpen size={46} strokeWidth={1} />
                <h3>A Palavra continua consigo.</h3>
                <p>
                  As mensagens serão disponibilizadas
                  <br />
                  depois de validadas pela equipa.
                </p>
                <Link className="text-link" href="/mensagens">
                  Espaço de mensagens <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
      {!copy.ministries.hidden && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{copy.ministries.eyebrow}</p>
              <h2>{copy.ministries.title}</h2>
              {copy.ministries.body && <p>{copy.ministries.body}</p>}
            </div>
            <Link href="/ministerios" className="text-link">
              Todos os ministérios <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="ministries-grid">
            {ministries.map((m, i) => (
              <MinistryCard key={m.id} item={m} index={i} />
            ))}
          </div>
        </section>
      )}
      {album && !copy.gallery.hidden && (
        <section className="home-gallery">
          <div className="container section-heading">
            <div>
              <p className="eyebrow">{copy.gallery.eyebrow}</p>
              <h2>{copy.gallery.title}</h2>
            </div>
            <Link href="/galeria" className="text-link">
              Ver a galeria <ArrowUpRight size={18} />
            </Link>
          </div>
          <div
            className="gallery-ribbon"
            style={{
              gridTemplateColumns: `repeat(${Math.min(4, album.data.images?.length || 1)},1fr)`,
            }}
          >
            {(album.data.images || []).slice(0, 4).map((p: any) => (
              <Link href="/galeria" key={p.image}>
                <Photo id={p.image} alt={p.alt} />
              </Link>
            ))}
          </div>
          <p className="container caption">{copy.gallery.body}</p>
        </section>
      )}
    </>
  );
}
