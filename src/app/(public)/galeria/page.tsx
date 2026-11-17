import { contents } from "@/lib/content";
import { PageIntro, RichText } from "@/components/content-view";
import { Gallery } from "@/components/gallery";
export const metadata = {
  title: "Galeria",
  alternates: { canonical: "/galeria" },
};
export default async function GalleryPage() {
  const albums = await contents("album");
  return (
    <>
      <PageIntro
        eyebrow="A VIDA DA NOSSA COMUNIDADE"
        title="Há momentos que ficam."
        subtitle="Histórias de encontro, fé e partilha, contadas em imagens."
      />
      <div className="container page-body">
        {albums.map((a) => (
          <section key={a.id} className="editorial-section">
            <h2>{a.title}</h2>
            <RichText text={a.data.body} />
            <Gallery images={a.data.images || []} />
          </section>
        ))}
      </div>
    </>
  );
}
