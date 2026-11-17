import { listRecords, getRecord } from "@/lib/store";
import { staff } from "@/lib/firebase";
import { dateLabel } from "@/lib/model";
import { DeleteMessage } from "@/components/delete-message";
export default async function Inbox() {
  const { profile } = await staff();
  const data = (await listRecords<any>("messages"))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 100);
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Uma porta aberta à conversa.</h1>
          <p>
            Mensagens privadas recebidas pelo formulário. As 100 mais recentes.
          </p>
        </div>
      </div>
      <div className="admin-panel">
        {data.map((m) => (
          <article className="message-card" key={m.id}>
            <p className="eyebrow">{dateLabel(m.created_at, true)}</p>
            <h2>{m.subject}</h2>
            <h3>
              {m.name} ·{" "}
              <a href={`mailto:${m.email}`} className="text-link">
                {m.email}
              </a>
            </h3>
            <p className="preserve">{m.message}</p>
            {profile.role === "admin" && <DeleteMessage id={m.id} />}
          </article>
        ))}
        {!data.length && <p>Ainda não recebeu mensagens.</p>}
      </div>
    </>
  );
}
