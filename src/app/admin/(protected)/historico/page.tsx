import { listRecords, getRecord } from "@/lib/store";
import { redirect } from "next/navigation";
import { staff } from "@/lib/firebase";
import { dateLabel } from "@/lib/model";
export default async function Audit() {
  let session;
  try {
    session = await staff(true);
  } catch {
    redirect("/admin");
  }
  const data = (await listRecords<any>("audit_log"))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 200);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Um registo de cuidado.</h1>
          <p>
            Últimas 200 operações. O histórico editorial de cada conteúdo está
            no respetivo editor.
          </p>
        </div>
      </div>
      <div className="admin-panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Operação</th>
              <th>Autor</th>
              <th>Entidade</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id}>
                <td>{a.action}</td>
                <td>{a.actor || "Serviço / configuração inicial"}</td>
                <td>{a.entity_id}</td>
                <td>{dateLabel(a.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
