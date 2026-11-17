import Link from "next/link";
import { staff } from "@/lib/supabase";
import { dateLabel, type Content, eventIsUpcoming } from "@/lib/model";
export default async function Dashboard() {
  const { supabase } = await staff();
  const { data, error } = await supabase
    .from("content")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const all = (data || []) as Content[];
  const upcoming = all
    .filter((c) => c.status === "published" && eventIsUpcoming(c))
    .sort((a, b) => (a.starts_at || "").localeCompare(b.starts_at || ""));
  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">BEM-VINDO À ÁREA DA EQUIPA</p>
          <h1>Vamos cuidar da comunidade.</h1>
          <p>Os próximos encontros e as histórias que ainda vamos contar.</p>
        </div>
      </div>
      <div className="stats-grid">
        {[
          [upcoming.length, "Próximos eventos"],
          [
            all.filter((c) => c.status === "draft").length,
            "Rascunhos para rever",
          ],
          [
            all.filter((c) => c.status === "published").length,
            "Conteúdos publicados",
          ],
        ].map(([n, label]) => (
          <div className="stat" key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="admin-panel">
        <h2>O que vamos partilhar?</h2>
        <div className="admin-actions">
          <Link
            href="/admin/conteudos/novo?tipo=event"
            className="button primary"
          >
            + Criar evento
          </Link>
          <Link
            href="/admin/conteudos/novo?tipo=video"
            className="button outline"
          >
            + Adicionar vídeo
          </Link>
          <Link href="/admin/imagens" className="button outline">
            Carregar imagens
          </Link>
        </div>
      </div>
      <div className="admin-panel">
        <h2>Próximos eventos</h2>
        {upcoming.length ? (
          upcoming.slice(0, 5).map((c) => (
            <p key={c.id}>
              <Link className="text-link" href={`/admin/conteudos/${c.id}`}>
                {c.title} · {dateLabel(c.starts_at!, true)} ↗
              </Link>
            </p>
          ))
        ) : (
          <p>Sem eventos futuros publicados.</p>
        )}
      </div>
      <div className="admin-panel">
        <h2>Trabalho recente</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Conteúdo</th>
                <th>Estado</th>
                <th>Atualização</th>
              </tr>
            </thead>
            <tbody>
              {all.slice(0, 10).map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/conteudos/${c.id}`}>{c.title}</Link>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
