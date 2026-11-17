import { createClient } from "@supabase/supabase-js";
import { demoContent } from "../src/lib/demo";
import { lisbonToUtc } from "../src/lib/model";
async function main() {
  const s = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { count, error } = await s
    .from("content")
    .select("*", { head: true, count: "exact" });
  if (error) throw error;
  if (count)
    throw new Error(
      "A base já tem conteúdos. O seed não substitui trabalho editorial.",
    );
  const rows = demoContent.map(
    ({ id, updated_at, starts_at, ends_at, ...c }) => ({
      ...c,
      starts_at: c.kind === "event" ? lisbonToUtc(c.data.start) : null,
      ends_at: c.kind === "event" ? lisbonToUtc(c.data.end) : null,
    }),
  );
  const { error: writeError } = await s.from("content").insert(rows);
  if (writeError) throw writeError;
  console.log(
    "Conteúdos de demonstração instalados e identificados. Reveja-os antes de lançar o site.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
