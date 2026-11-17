import { contents } from "@/lib/content";
import { ical } from "@/lib/ical";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const c = (await contents("event")).find((c) => c.id === id);
  if (!c) return new Response("Evento não encontrado", { status: 404 });
  return new Response(
    ical(c, process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${c.slug}.ics"`,
      },
    },
  );
}
