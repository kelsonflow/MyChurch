import { db } from "@/lib/supabase";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; size: string }> },
) {
  const { id, size } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !["small", "large"].includes(size))
    return new Response(null, { status: 404 });
  try {
    const s = await db();
    const { data: m } = await s
      .from("media")
      .select("id")
      .eq("id", id)
      .single();
    if (!m) return new Response(null, { status: 404 });
    const { data, error } = await s.storage
      .from("media")
      .download(`${id}/${size}.webp`);
    if (error || !data) return new Response(null, { status: 404 });
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
