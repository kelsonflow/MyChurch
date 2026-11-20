import { settings } from "@/lib/content";
import { configured } from "@/lib/firebase";
import { PageIntro } from "@/components/content-view";
import { ContactForm } from "@/components/contact-form";
import { ChurchMap } from "@/components/church-map";
export const metadata = {
  title: "Contactos",
  alternates: { canonical: "/contactos" },
};
export default async function Contact() {
  const s = await settings();
  return (
    <>
      <PageIntro
        eyebrow="QUEREMOS OUVIR A SUA HISTÓRIA"
        title="Uma conversa começa com um olá."
        subtitle="Estamos aqui para responder às suas perguntas e ajudar a preparar a sua visita."
      />
      <div className="container contact-grid page-body">
        <div>
          <h2>Fique mais perto.</h2>
          <div className="contact-meta">
            <h3>Onde estamos</h3>
            <p>{s.address || "A morada está a ser confirmada pela igreja."}</p>
            {s.map && (
              <a href={s.map} target="_blank" rel="noopener noreferrer">
                Abrir no GPS ↗
              </a>
            )}
          </div>
          {s.address && <ChurchMap address={s.address} />}
          <div className="contact-meta">
            <h3>Quando nos encontramos</h3>
            <p className="preserve">
              {s.schedule ||
                "Os horários atualizados serão publicados após confirmação."}
            </p>
          </div>
          <div className="contact-meta">
            <h3>Fale connosco</h3>
            {s.email && (
              <p>
                <a href={`mailto:${s.email}`}>{s.email}</a>
              </p>
            )}
            {s.phone && (
              <p>
                <a href={`tel:${s.phone.replace(/\s/g, "")}`}>{s.phone}</a>
              </p>
            )}
            {s.whatsapp && (
              <p>
                <a
                  href={`https://wa.me/${s.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp ↗
                </a>
              </p>
            )}
            {!s.email && !s.phone && (
              <p>Contactos institucionais em validação.</p>
            )}
          </div>
        </div>
        <div>
          <h2>Envie-nos uma mensagem</h2>
          <ContactForm
            enabled={configured() && (s.contactEnabled || s.confirmed)}
          />
        </div>
      </div>
    </>
  );
}
