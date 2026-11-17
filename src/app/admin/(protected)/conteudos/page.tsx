import { listRecords, getRecord } from "@/lib/store";
import Link from "next/link";
import { staff } from "@/lib/firebase";
import { kinds, labels, type Kind, type Content, dateLabel } from "@/lib/model";
export default async function ContentList({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo } = await searchParams;
  const kind = kinds.includes(tipo as Kind) ? (tipo as Kind) : "page";
  await staff();
  const data = (await listRecords<any>("content"))
    .filter((c) => c.kind === kind)
    .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>{labels[kind]}</h1>
          <p>
            Crie, reveja e publique. As alterações chegam ao site de imediato.
          </p>
        </div>
        <Link
          className="button primary"
          href={`/admin/conteudos/novo?tipo=${kind}`}
        >
          + Criar conteúdo
        </Link>
      </div>
      <div className="admin-panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Estado</th>
                <th>Atualização</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(data as Content[]).map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.title}
                    <br />
                    <small>/{c.slug}</small>
                  </td>
                  <td>
                    <span className={`badge status-${c.status}`}>
                      {c.status === "published"
                        ? "Publicado"
                        : c.status === "draft"
                          ? "Rascunho"
                          : "Arquivado"}
                    </span>
                  </td>
                  <td>{dateLabel(c.updated_at)}</td>
                  <td>
                    <Link
                      href={`/admin/conteudos/${c.id}`}
                      className="text-link"
                    >
                      Editar ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && <p>Ainda não existem conteúdos desta categoria.</p>}
        </div>
      </div>
    </>
  );
}
