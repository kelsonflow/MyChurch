import { redirect } from "next/navigation";
import { staff } from "@/lib/supabase";
import { dateLabel } from "@/lib/model";
export default async function Audit() {
  let session;
  try {
    session = await staff(true);
  } catch {
    redirect("/admin");
  }
  const { data, error } = await session.supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
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
