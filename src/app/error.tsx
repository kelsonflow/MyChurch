"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container not-found">
      <h1>Não foi possível carregar esta página.</h1>
      <p>Se o problema persistir, contacte a equipa da igreja.</p>
      <button className="button primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
