import { contents } from "@/lib/content";
import { PageIntro, MinistryCard, DemoLabel } from "@/components/content-view";
export const metadata = {
  title: "Ministérios",
  alternates: { canonical: "/ministerios" },
};
export default async function Ministries() {
  const items = (await contents("ministry")).filter((m) => !m.data.hidden);
  return (
    <>
      <PageIntro
        eyebrow="CADA PESSOA TEM UM LUGAR"
        title="Uma comunidade. Muitas formas de servir."
        subtitle="Descubra os espaços de encontro, crescimento e cuidado da nossa igreja."
      />
      <section className="container page-body">
        <div className="ministries-grid">
          {items.map((m, i) => (
            <MinistryCard key={m.id} item={m} index={i} />
          ))}
        </div>
        {items.some((m) => m.data.demo) && (
          <p className="caption">
            Descrições de demonstração. Atividades, responsáveis e horários
            aguardam validação.
          </p>
        )}
      </section>
    </>
  );
}
