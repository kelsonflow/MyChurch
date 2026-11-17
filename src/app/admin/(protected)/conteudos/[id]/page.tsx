import { notFound } from "next/navigation";
import { staff } from "@/lib/firebase";
import { listRecords, getRecord } from "@/lib/store";
import { ContentEditor } from "@/components/content-editor";
import { kinds, type Kind, type Content, type Media } from "@/lib/model";
export default async function Edit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;
  await staff();
  const media = await listRecords<Media>("media");
  let item: Content | undefined;
  let revisions: any[] = [];
  if (id !== "novo") {
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
    item = await getRecord<Content>("content", id);
    if (!item) notFound();
    revisions = (await listRecords<any>("revisions"))
      .filter((r) => r.content_id === id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 30);
  }
  return (
    <ContentEditor
      key={id}
      item={item}
      kind={
        item?.kind || (kinds.includes(tipo as Kind) ? (tipo as Kind) : "page")
      }
      media={media}
      revisions={revisions}
    />
  );
}
