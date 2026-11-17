# Verificação e lançamento

## Verificações locais automatizadas

- `npm run typecheck`: TypeScript da aplicação e dos testes.
- `npm test`: validação YouTube, datas DST, duração/arquivo, ICS e isolamento no PostgreSQL.
- `npm run build`: compilação de produção.
- `npm audit`: auditoria de dependências no momento da entrega; repetir após atualizações.

Para verificar um servidor local já iniciado, execute `node scripts/smoke.mjs http://localhost:3000`. O teste assume uma base de demonstração sem credenciais e nunca envia uma mensagem válida. Para testar o build use `npm start -- --port 3001` e indique a porta 3001 ao script.

## Verificação de integração no Supabase configurado

Esta lista representa verificações a executar antes de abrir o site ao público; não afirma que serviços externos sem credenciais tenham sido testados.

1. Aplicar a migration e o seed numa base de ensaio. Criar primeiro administrador por convite. Confirmar que o link aceita uma só utilização e expira no prazo configurado.
2. Pedir recuperação de palavra-passe, concluir e testar o novo login. Confirmar que não existe signup público e que as respostas de recuperação não revelam se um email existe.
3. Convidar um editor, entrar numa janela separada e criar evento rascunho. Como visitante, confirmar que a página/consulta REST não devolve o rascunho. Publicar e verificar o conteúdo no site sem novo build.
4. Testar chamada REST direta com JWT do editor para INSERT/UPDATE/DELETE em `profiles` e UPDATE de `settings`: devem ser recusadas ou não afetar linhas. Tentar elevar o próprio perfil.
5. Guardar um JWT de teste, suspender o respetivo editor e repetir escrita via REST com esse JWT: deve ser bloqueada imediatamente. Reativar e testar novo login. Revogar e testar de novo. Proteger último administrador, incluindo operações concorrentes.
6. Editar um conteúdo duas vezes, recuperar uma versão e confirmar que regressa como rascunho, com histórico privado e autor preservado.
7. Carregar imagem JPEG válida e um ficheiro de texto renomeado `.jpg`: só a imagem deve ser aceite. Testar limite de bytes/píxeis, EXIF removido, foco e alternativa textual. Confirmar que uma imagem só usada num rascunho não é acessível sem sessão.
8. Criar eventos de vários dias e datas de inverno/verão. Recusar fim anterior ao início e hora inexistente de primavera. Confirmar arquivo depois do fim. Importar o `.ics` em calendário compatível e verificar horas em Lisboa.
9. Alterar um vídeo com link válido e tentar `youtube.com.evil.test`/HTML arbitrário. Confirmar que a página não liga ao YouTube antes do clique de autorização e não reproduz automaticamente com som.
10. Validar contactos/política, enviar mensagem e vê-la apenas no painel. Testar campos inválidos, erro de rede, spam/honeypot, limite de envios e proxy de IP. Não usar dados pessoais reais no ensaio. Verificar notificação SMTP/Resend se ativada.
11. Percorrer todas as páginas e o painel com teclado. Confirmar foco visível, labels, Escape na galeria/menu, devolução de foco no diálogo e zoom a 200%.
12. Testar 320, 375, 768, 1280 e 1440 px; confirmar ausência de scroll horizontal. Testar leitor de ecrã e movimento reduzido. A meta WCAG 2.2 AA exige revisão humana adicional; não representa certificação.
13. Medir Core Web Vitals no alojamento real, com imagens definitivas e em dispositivos móveis. Metas: LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1, ao percentil 75, segundo [Web Vitals](https://web.dev/articles/vitals). Não substituir dados de campo por uma captura local. Confirmar sitemap/canonicals/OG, 404 e noindex das páginas privadas.
14. Restaurar um backup de ensaio incluindo Auth, PostgreSQL e bytes Storage. Confirmar que apenas os responsáveis aprovados conservam acessos.

## Antes de lançar

Validar morada, horários, contactos, liderança, ministérios, eventos e direitos de imagem. Substituir textos demonstrativos e minutas legais. Confirmar SMTP, retenção de mensagens, backups, TLS, limites do proxy, variáveis e responsável pela manutenção. Só então assinalar a validação institucional em Configurações.
