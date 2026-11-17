import { staff } from "@/lib/firebase";
import { bucket } from "@/lib/firebase-admin";
import { mediaVisible } from "@/lib/store";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; size: string }> },
) {
  const { id, size } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id) || !["small", "large"].includes(size))
    return new Response(null, { status: 404 });
  try {
    let member = false;
    try {
      await staff();
      member = true;
    } catch {}
    if (!(await mediaVisible(id, member)))
      return new Response(null, { status: 404 });
    const [bytes] = await bucket().file(`media/${id}/${size}.webp`).download();
    return new Response(new Uint8Array(bytes), {
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
