# Verificação antes de utilização institucional

## Automatizada

- `npm run typecheck`: tipos da aplicação e scripts.
- `npm test`: acesso/perfis, último administrador, validação de YouTube, calendário ICS, datas Europe/Lisbon e tamanho dos pedidos.
- `npm run test:firebase`: emuladores oficiais; rascunhos/mensagens privados, escritas diretas recusadas, suspensão, Storage privado, histórico e recuperação.
- `npm run build`: compilação de produção.

## Fluxos a confirmar pela equipa

1. Aceitar o email de acesso, definir palavra-passe e entrar em `/admin`.
2. Convidar um editor; confirmar que não gere utilizadores nem configurações, incluindo por chamada direta.
3. Suspender/revogar um acesso e confirmar que a sessão antiga é recusada. Confirmar que o último administrador ativo não pode ser retirado.
4. Criar evento rascunho, rever e publicar. Confirmar aparecimento no site sem novo build; fim anterior ao início deve ser recusado; eventos terminados aparecem no arquivo.
5. Alterar vídeo e testar consentimento YouTube. O serviço externo não deve carregar antes do clique.
6. Carregar uma imagem válida e recusar ficheiro disfarçado ou excessivo. Verificar texto alternativo, foco, versões WebP e impossibilidade de eliminar imagens utilizadas.
7. Recuperar versão anterior como rascunho. Confirmar autor/data e privacidade do histórico.
8. Depois de validar os contactos e política, ativar o formulário. Verificar sucesso/erro, receção privada, limites de pedidos e eventual notificação.
9. Testar teclado, Escape, foco, leitor de ecrã, zoom a 200%, movimento reduzido e layouts desde 320 px.
10. Medir LCP, INP e CLS no alojamento final; não afirmar métricas ou certificação WCAG sem medição/revisão adequadas. Referência: [Web Vitals](https://web.dev/articles/vitals).
11. Confirmar canonical/sitemap HTTPS, noindex privado e 404.
12. Ensaiar o restauro conjunto de Firestore, Auth e Storage antes de depender dos backups.

Antes do lançamento institucional: substituir exemplos e minutas, confirmar morada/horários/contactos/liderança e direitos de imagem. A publicação técnica não valida esses dados.
