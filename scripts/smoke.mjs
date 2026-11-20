import assert from "node:assert/strict";
const base = new URL(process.argv[2] || "http://localhost:3000");
if (
  ![
    "localhost",
    "127.0.0.1",
    "[::1]",
    "mychurch-kelsonflow.web.app",
    "project-b8361f5e-fc32-4291-b37.web.app",
  ].includes(base.hostname)
)
  throw new Error(
    "O smoke test só aceita o servidor local ou o site MyChurch.",
  );
const pages = [
  "/",
  "/a-igreja",
  "/primeira-visita",
  "/ministerios",
  "/ministerios/jovens",
  "/agenda",
  "/agenda/celebracao-demo",
  "/mensagens",
  "/galeria",
  "/contactos",
  "/privacidade",
  "/termos",
  "/robots.txt",
  "/sitemap.xml",
  "/icon.svg",
];
for (const path of pages) {
  const response = await fetch(new URL(path, base));
  assert.equal(response.status, 200, path);
}
for (const path of [
  "/admin",
  "/admin/utilizadores",
  "/admin/previsualizar/00000000-0000-0000-0000-000000000001",
]) {
  const response = await fetch(new URL(path, base), { redirect: "manual" });
  assert.ok([303, 307].includes(response.status), path);
  assert.ok(response.headers.get("location")?.endsWith("/admin/login"), path);
}
assert.equal(
  (await fetch(new URL("/pagina-inexistente-404", base))).status,
  404,
);
for (const path of ["/api/contact", "/api/media"]) {
  const response = await fetch(new URL(path, base), {
    method: "POST",
    headers: {
      Origin: "https://invalid.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(response.status, 403, path);
}
const eventHtml = await (
  await fetch(new URL("/agenda/celebracao-demo", base))
).text();
const calendarPath = eventHtml.match(/href="(\/api\/calendar\/[^"?]+)"/)?.[1];
assert.ok(calendarPath, "Ligação do calendário no evento");
const calendar = await fetch(new URL(calendarPath, base));
assert.equal(calendar.status, 200);
assert.ok((await calendar.text()).includes("BEGIN:VCALENDAR"));
const home = await fetch(base);
assert.ok(
  home.headers
    .get("content-security-policy")
    ?.includes("frame-ancestors 'none'"),
);
console.log(
  "23 verificações HTTP passaram: páginas, 404, autenticação privada, rejeição de origens, calendário e CSP.",
);
