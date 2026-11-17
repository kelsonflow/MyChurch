# Validação da migração Firebase · 17 de novembro de 2026

A implementação atual usa Firebase Hosting, Cloud Run, Firestore, Firebase Authentication e Cloud Storage. As dependências e a migration SQL da implementação anterior foram removidas.

- TypeScript e build Next.js de produção aprovados.
- Sete testes de domínio aprovados.
- Três testes de integração aprovados nos emuladores oficiais Authentication/Firestore/Storage: sessão válida e suspensão imediata, regras de acesso e transações. O teste HTTP autenticado abre os cinco editores e os seus ficheiros JavaScript, cria conteúdos nas cinco categorias, edita e publica um ministério e confirma a alteração na página pública e no histórico.
- 23 verificações HTTP aprovadas no site público Firebase Hosting: páginas, autenticação privada, calendário, 404, rejeição de origens e CSP.
- Cloud Run e Firebase Hosting publicados em `https://mychurch-kelsonflow.web.app`. Cada nova compilação identifica a versão nos URLs dos recursos e na navegação para proteger sessões abertas durante atualizações.
- Regras Firestore/Storage compiladas e publicadas no projeto real.
- Registo público desativado e política mínima de 12 caracteres configurada no Firebase Authentication.
- Conteúdos demonstrativos inicializados no Firestore real.
- Convites iniciais enviados aos dois emails indicados pelo responsável.

Os testes de integração são omitidos em `npm test` quando os emuladores não estão ativos. Execute `npm run test:firebase` para os reproduzir. Os avisos PERMISSION_DENIED nos pedidos negativos são esperados.

Os resultados visuais anteriores da página inicial, agenda, menu móvel, FAQ e galeria continuam relevantes, pois o design foi preservado. As métricas Core Web Vitals e a verificação humana de acessibilidade/conteúdos mantêm-se como tarefas de lançamento. Não se afirma certificação WCAG nem pontuação Lighthouse sem medição.
