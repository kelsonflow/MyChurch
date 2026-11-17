"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowUpRight } from "lucide-react";
const links = [
  ["A igreja", "/a-igreja"],
  ["Primeira visita", "/primeira-visita"],
  ["Ministérios", "/ministerios"],
  ["Agenda", "/agenda"],
  ["Mensagens", "/mensagens"],
  ["Contactos", "/contactos"],
];
export function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  return (
    <>
      <button
        ref={toggle}
        className="menu-toggle icon-button"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav
        id="main-nav"
        className={open ? "navigation open" : "navigation"}
        aria-label="Navegação principal"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
      >
        {links.map(([title, href]) => (
          <Link
            key={href}
            href={href}
            aria-current={path.startsWith(href) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {title}
          </Link>
        ))}
        <Link
          className="nav-visit"
          href="/primeira-visita"
          onClick={() => setOpen(false)}
        >
          Visite-nos <ArrowUpRight size={16} />
        </Link>
      </nav>
    </>
  );
}
