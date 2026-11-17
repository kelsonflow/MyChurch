# Resultados locais · 17 de novembro de 2026

Verificado nesta entrega:

- Build Next.js de produção concluído, incluindo verificação TypeScript.
- Testes automatizados de domínio e de PostgreSQL embebido aprovados. Cobrem links YouTube, horário de verão, ordenação por fim, ICS, limites de corpo, RLS, privilégios de editor, sessões suspensas, último administrador, versões, ficheiros privados e limitação de mensagens.
- Smoke test HTTP no build de produção local: 23 verificações aprovadas, incluindo 15 rotas públicas, três redirecionamentos privados, 404, rejeição de origens no contacto/upload, calendário e CSP.
- Auditoria npm sem vulnerabilidades conhecidas no momento da instalação final.
- Inspeção visual no navegador a 320 px (agenda e filtros), 1440 px (início) e largura intermédia. Sem scroll horizontal nas vistas inspecionadas. Menu móvel, navegação, FAQ, ampliação da galeria, fotografia seguinte, Escape e devolução de foco exercitados.

Limites da verificação:

- Sem credenciais Supabase/SMTP: login real, emails de convite/recuperação, upload Storage e envio persistente do formulário precisam de validação na conta configurada. PGlite testa a migration e as permissões em PostgreSQL; usa tabelas de Auth/Storage de ensaio.
- Sem medição Lighthouse/Core Web Vitals nesta sessão. Não se afirma atingir metas de desempenho nem conformidade WCAG certificada.
- No fim da inspeção, a ligação do navegador integrado ao servidor local tornou-se indisponível; as verificações HTTP continuaram a responder com sucesso. Isso limitou uma repetição visual final a 375 px. Os resultados visuais acima correspondem às vistas efetivamente observadas antes dessa interrupção.
- Textos institucionais, contactos, política de privacidade e direitos das fotografias históricas ainda requerem validação da igreja.

Os servidores temporários de verificação foram encerrados. Para abrir novamente use `npm run dev` na pasta do projeto.
