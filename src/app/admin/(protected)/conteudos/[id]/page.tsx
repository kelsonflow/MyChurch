import { notFound } from "next/navigation";
import { staff } from "@/lib/supabase";
import { ContentEditor } from "@/components/content-editor";
import { kinds, type Kind, type Content } from "@/lib/model";
export default async function Edit({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;
  const { supabase } = await staff();
  const { data: media, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  let item: Content | undefined;
  let revisions: any[] = [];
  if (id !== "novo") {
    if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
    const { data } = await supabase
      .from("content")
      .select("*")
      .eq("id", id)
      .single();
    if (!data) notFound();
    item = data;
    const r = await supabase
      .from("revisions")
      .select("*")
      .eq("content_id", id)
      .order("created_at", { ascending: false })
      .limit(30);
    revisions = r.data || [];
  }
  return (
    <ContentEditor
      key={id}
      item={item}
      kind={
        item?.kind || (kinds.includes(tipo as Kind) ? (tipo as Kind) : "page")
      }
      media={media || []}
      revisions={revisions}
    />
  );
}
