import Link from "next/link";
import { ArrowUpRight, MapPin, Clock, ArrowRight } from "lucide-react";
import { Brand } from "./brand";
import { Navigation } from "./navigation";
import { settings } from "@/lib/content";
import { configured } from "@/lib/firebase";
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const s = await settings();
  return (
    <>
      <a className="skip" href="#main">
        Saltar para o conteúdo
      </a>
      {(!configured() || !s.confirmed) && (
        <div className="demo-bar">
          Pré-visualização · conteúdos de demonstração. Horários e contactos por
          confirmar.
        </div>
      )}
      <header className="site-header">
        <div className="container header-inner">
          <Brand name={s.name} logo={s.logo} />
          <Navigation />
        </div>
      </header>
      <main id="main">{children}</main>
      {s.confirmed && s.address && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Church",
              name: s.name,
              address: s.address,
              url: process.env.NEXT_PUBLIC_SITE_URL,
              ...(s.email ? { email: s.email } : {}),
              ...(s.phone ? { telephone: s.phone } : {}),
            }).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <section className="contact-banner">
        <div className="container">
          <div>
            <p className="eyebrow">ESTAMOS AQUI PARA SI</p>
            <h2>{s.contactTitle}</h2>
            <p>{s.contactText}</p>
          </div>
          <Link href="/contactos" className="button gold">
            Entre em contacto <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <footer>
        <div className="container footer-grid">
          <div>
            <Brand light name={s.name} logo={s.logo} />
            <p>{s.tagline}</p>
          </div>
          <div>
            <h3>Encontre o seu lugar</h3>
            <Link href="/a-igreja">A nossa igreja</Link>
            <Link href="/primeira-visita">Prepare a sua visita</Link>
            <Link href="/ministerios">Ministérios</Link>
            <Link href="/galeria">Galeria da comunidade</Link>
          </div>
          <div>
            <h3>Visite-nos</h3>
            <p>{s.address || "Morada por confirmar pela igreja."}</p>
            <p>{s.schedule || "Horários por confirmar."}</p>
            <Link href="/contactos">
              Contactos <ArrowRight size={14} />
            </Link>
          </div>
          <div>
            <h3>Mantenha-se perto</h3>
            {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
            {s.phone && (
              <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
            )}
            {[
              ["Instagram", s.instagram],
              ["Facebook", s.facebook],
              ["YouTube", s.youtube],
            ]
              .filter(([, url]) => url)
              .map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {name}
                  <ArrowUpRight size={13} />
                </a>
              ))}
            {!s.email && !s.phone && <p>Contactos oficiais em validação.</p>}
            <Link href="/admin">Área da equipa</Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {s.name}
          </span>
          <div>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos</Link>
            <a href="/sitemap.xml">Mapa do site</a>
          </div>
        </div>
      </footer>
    </>
  );
}
export function VisitInfo({ s }: { s: Awaited<ReturnType<typeof settings>> }) {
  return (
    <div className="visit-info">
      <div>
        <Clock size={24} />
        <div>
          <span className="eyebrow">JUNTOS NA FÉ</span>
          <h3>Os nossos cultos</h3>
          <p className="preserve">
            {s.schedule || "Horários a confirmar pela igreja."}
          </p>
        </div>
      </div>
      <div>
        <MapPin size={24} />
        <div>
          <span className="eyebrow">DE PORTAS ABERTAS</span>
          <h3>Venha conhecer-nos</h3>
          <p>{s.address || "Morada e acessos em atualização."}</p>
        </div>
      </div>
      <Link href="/primeira-visita" className="text-link">
        Tudo para a sua visita <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}
