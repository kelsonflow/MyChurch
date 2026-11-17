import { staff } from "@/lib/supabase";
import { dateLabel } from "@/lib/model";
import { DeleteMessage } from "@/components/delete-message";
export default async function Inbox() {
  const { supabase, profile } = await staff();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
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
