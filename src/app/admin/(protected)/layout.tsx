import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  PlaySquare,
  Users,
  Images,
  Settings,
  Mail,
  History,
  LogOut,
  ArrowUpRight,
  Heart,
} from "lucide-react";
import { staff } from "@/lib/firebase";
import { logout } from "../actions";
import { Brand } from "@/components/brand";
export default async function Protected({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await staff();
  } catch {
    redirect("/admin/login");
  }
  const admin = session.profile.role === "admin";
  const nav = [
    ["Visão geral", "/admin", LayoutDashboard],
    ["Páginas", "/admin/conteudos?tipo=page", FileText],
    ["Eventos", "/admin/conteudos?tipo=event", CalendarDays],
    ["Vídeos", "/admin/conteudos?tipo=video", PlaySquare],
    ["Ministérios", "/admin/conteudos?tipo=ministry", Heart],
    ["Álbuns", "/admin/conteudos?tipo=album", Images],
    ["Imagens", "/admin/imagens", Images],
    ["Mensagens recebidas", "/admin/mensagens", Mail],
    ...(admin
      ? [
          ["Utilizadores", "/admin/utilizadores", Users],
          ["Configurações", "/admin/configuracoes", Settings],
          ["Histórico de acessos", "/admin/historico", History],
        ]
      : []),
  ] as const;
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Brand light />
        <nav aria-label="Gestão">
          {nav.map(([label, href, Icon]) => (
            <Link key={href as string} href={href as string}>
              <Icon size={17} />
              {label as string}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>
            {session.user.email}
            <br />
            {admin ? "Administrador" : "Editor"}
          </p>
          <form action={logout}>
            <button className="icon-button" aria-label="Terminar sessão">
              <LogOut size={18} />
            </button>
          </form>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-top">
          <p>MISSÃO AOS POVOS / ÁREA DA EQUIPA</p>
          <Link href="/" target="_blank">
            Ver site público ↗
          </Link>
        </header>
        {children}
      </main>
    </div>
  );
}
