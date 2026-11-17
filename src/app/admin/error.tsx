"use client";

export default function AdminError() {
  return (
    <main className="container not-found">
      <h1>Vamos recarregar o painel.</h1>
      <p>
        Não foi possível abrir esta página. O painel pode ter sido atualizado
        enquanto o tinha aberto. Recarregue para obter a versão atual.
      </p>
      <button
        className="button primary"
        onClick={() => window.location.reload()}
      >
        Recarregar painel
      </button>
      <a className="text-link" href="/admin">
        Voltar ao painel
      </a>
    </main>
  );
}
