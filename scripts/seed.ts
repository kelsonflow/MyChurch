import { randomUUID } from "node:crypto";
import { firestore } from "../src/lib/firebase-admin";
import { writeContent } from "../src/lib/store";
import { demoContent, defaultSettings } from "../src/lib/demo";
async function main() {
  const db = firestore();
  const existing = await db.collection("content").limit(1).get();
  if (!existing.empty)
    throw new Error(
      "Já existem conteúdos. O seed não substitui trabalho editorial.",
    );
  for (const c of demoContent) await writeContent(c, "bootstrap", randomUUID());
  await db.doc("settings/general").set({ data: defaultSettings });
  console.log(
    "Conteúdos de demonstração guardados no Firestore. Valide-os antes de lançar o site.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
