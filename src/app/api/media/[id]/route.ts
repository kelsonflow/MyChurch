import { staff } from "@/lib/firebase";
import { mediaVisible } from "@/lib/store";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    let member = false;
    try {
      await staff();
      member = true;
    } catch {}
    const m = await mediaVisible(id, member);
    return m
      ? Response.json(
          {
            alt: m.alt,
            caption: m.caption,
            focal_x: m.focal_x,
            focal_y: m.focal_y,
          },
          { headers: { "Cache-Control": "private, no-store" } },
        )
      : new Response(null, { status: 404 });
  } catch {
    return new Response(null, { status: 404 });
  }
}
