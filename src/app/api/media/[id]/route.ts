import { db } from "@/lib/supabase";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const s = await db();
    const { data } = await s
      .from("media")
      .select("alt,caption,focal_x,focal_y")
      .eq("id", id)
      .single();
    return data
      ? Response.json(data, {
          headers: { "Cache-Control": "private, no-store" },
        })
      : new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
