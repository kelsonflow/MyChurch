"use client";
import { useState, useRef } from "react";
import Link from "next/link";
export function ContactForm({ enabled }: { enabled: boolean }) {
  const [state, setState] = useState<{
    busy: boolean;
    ok?: boolean;
    message?: string;
  }>({ busy: false });
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      className="form-stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ busy: true });
        try {
          const data = Object.fromEntries(new FormData(e.currentTarget));
          const r = await fetch("/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const body = await r.json();
          setState({ busy: false, ok: r.ok, message: body.message });
          if (r.ok) form.current?.reset();
        } catch {
          setState({
            busy: false,
            ok: false,
            message:
              "Não foi possível enviar. Verifique a ligação e tente novamente.",
          });
        }
      }}
    >
      <div className="form-grid">
        <label className="field">
          O seu nome
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label className="field">
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            required
          />
        </label>
      </div>
      <label className="field">
        Assunto
        <input name="subject" minLength={3} maxLength={160} required />
      </label>
      <label className="field">
        Mensagem
        <textarea
          name="message"
          rows={6}
          minLength={10}
          maxLength={5000}
          required
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        Deixe em branco
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <p className="form-note">
        Usamos estes dados para responder ao seu pedido. Não envie informações
        sensíveis. Consulte a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
      {!enabled && (
        <p className="notice">
          O envio fica disponível após a configuração dos serviços e dos
          contactos oficiais da igreja.
        </p>
      )}
      <button
        className="button primary"
        disabled={state.busy || !enabled}
        type="submit"
      >
        {state.busy ? "A enviar…" : "Enviar mensagem ↗"}
      </button>
      <div aria-live="polite">
        {state.message && (
          <p
            className={`notice ${state.ok ? "" : "error"}`}
            role={state.ok ? "status" : "alert"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
