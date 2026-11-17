import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container not-found">
      <p className="eyebrow">404 · UM CAMINHO DIFERENTE</p>
      <h1>Vamos encontrar o seu lugar.</h1>
      <p>A página que procura não está disponível.</p>
      <Link href="/" className="button primary">
        Voltar ao início
      </Link>
    </main>
  );
}
