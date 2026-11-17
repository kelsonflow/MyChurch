# Missão aos Povos · Portugal

Aplicação Next.js App Router, TypeScript, Tailwind CSS e Supabase (PostgreSQL, Auth e Storage). Design em azul profundo, branco quente e dourado. Código de servidor em Node.js; não é uma exportação estática.

## Estado da entrega

O site público pode ser aberto sem credenciais, em **modo de demonstração explícito**. Nesse modo os formulários não fingem enviar mensagens e a administração não aceita credenciais fictícias. Com Supabase configurado, todas as leituras e escritas usam a base de dados; erros de ligação não são disfarçados com dados de demonstração.

Implementados: páginas públicas, agenda com categorias/arquivo/estados/calendário, ministérios, vídeos com consentimento, galeria acessível, formulário persistente, painel, editor estruturado, imagens WebP, autenticação e recuperação Supabase, convites, perfis, suspensão/revogação, versões recuperáveis e auditoria. O ficheiro SQL aplica RLS e proteções na base de dados.

**A ativação em produção depende** de um projeto Supabase, SMTP transacional, domínio/alojamento, aplicação da migration e validação dos conteúdos. O envio real de emails e os fluxos Auth/Storage não foram executados contra uma conta externa nesta entrega. Os testes PostgreSQL usam um motor real embebido, com tabelas de Auth/Storage de teste, não os serviços GoTrue/Storage do Supabase.

## Arranque local

Requer Node.js 22.13 ou superior e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). A [área privada](http://localhost:3000/admin) apresenta as instruções de configuração enquanto as variáveis estiverem vazias. Webpack é usado para evitar problemas de processos do Turbopack em ambientes Windows restritos.

## 1. Preparar o Supabase

1. Crie um projeto Supabase, preferencialmente numa região europeia apropriada à organização. Registe a decisão sobre os fornecedores e transferências de dados.
2. Execute **uma vez**, num projeto novo, [001_initial.sql](supabase/migrations/001_initial.sql) no SQL Editor ou através de `supabase db push` num projeto ligado. A migration cria tabelas, funções, RLS e o bucket **privado** `media`.
3. Preencha `.env.local` com URL, publishable key, service-role key e `NEXT_PUBLIC_SITE_URL`. A service-role key só existe no servidor e nos scripts de administração. Nunca use um prefixo `NEXT_PUBLIC_` para essa chave.
4. Gere `CONTACT_HASH_SECRET` com o comando indicado em `.env.example`.
5. Em Authentication, **desative novos registos públicos** e autenticação anónima. Não há página de registo nesta aplicação. A membership RLS também impede qualquer conta sem perfil ativo de editar conteúdos.
6. Configure Site URL e Redirect URLs para `https://seu-dominio/auth/confirm` e, no desenvolvimento, `http://localhost:3000/auth/confirm`. Use destinos exatos em produção.
7. Configure SMTP próprio no Supabase (fornecedor transacional à escolha), remetente e domínio autenticado. Convites e recuperação usam este SMTP; os limites do email de teste do Supabase não são adequados à produção.
8. Defina validade dos links OTP/convites para **3600 segundos** e mantenha limites de autenticação ativos. Configure palavra-passe mínima de 12 caracteres e proteção de palavras-passe comprometidas, quando disponível no plano.
9. Altere os templates de email para usar os links abaixo. Não envie ligações ou tokens por chats públicos.

Template **Invite user**:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite">Aceitar convite e definir palavra-passe</a>
```

Template **Reset password**:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Recuperar acesso</a>
```

O token é verificado pelo Supabase, tem utilização única e expiração definida no serviço. O callback aceita apenas `invite`, `recovery` ou um código PKCE válido e usa um destino interno fixo. Os links podem ser consumidos por scanners de email; nesses casos envie novo convite/recuperação e reveja a configuração do fornecedor.

## 2. Primeiro administrador, sem palavra-passe predefinida

Na sua máquina de confiança, com as variáveis locais configuradas:

```powershell
npm run bootstrap -- responsavel@dominio-da-igreja.pt
```

O script recusa criar outro administrador se já existir um ativo. Envia um convite Supabase; o destinatário define a sua própria palavra-passe. Nenhuma palavra-passe, token ou chave é impressa. Se o convite expirar, use a recuperação de acesso para o email já criado.

Para instalar os exemplos editáveis, **apenas numa base sem conteúdos**:

```powershell
npm run seed
```

O seed identifica os exemplos como demonstração e recusa substituir conteúdos existentes. Não cria testemunhos, números de membros ou contactos. A liderança atual não é inferida do site antigo. Arquive os eventos fictícios e valide os textos antes do lançamento.

## 3. Alojamento

Use um alojamento compatível com **Next.js Node.js**, como um servidor Node ou um fornecedor com suporte Next.js. Sites requer um Worker ESM; este projeto segue a stack Next.js solicitada e precisa de um adaptador próprio antes de poder ser alojado em Workers/Sites. Não foi publicado um endereço de produção.

```powershell
npm ci
npm test
npm run build
npm start
```

Configure as variáveis no gestor de segredos do alojamento. As variáveis `NEXT_PUBLIC_*` precisam de estar presentes na compilação. Defina a URL HTTPS definitiva, redirecione HTTP para HTTPS e ative HSTS no proxy depois de confirmar o certificado. Sirva um único domínio canónico.

O proxy de produção deve substituir, e não aceitar cegamente do cliente, `X-Forwarded-For`. O formulário usa esse endereço apenas para gerar uma chave HMAC temporária de limitação de pedidos, sem guardar o IP original. Defina um limite de corpo de **11 MB** no proxy para uploads e um limite global de pedidos no edge. Plataformas com limite de request inferior a 11 MB exigem redução do limite no upload ou um adaptador de upload direto com validação posterior.

As consultas públicas são dinâmicas e não ficam em cache entre utilizadores. Cada página volta a ler a base após publicação; não é necessário novo deployment. As rotas privadas e as imagens privadas usam `no-store`. Imagens associadas a conteúdos publicados ficam acessíveis pela rota de media; ao despublicar deixam de estar acessíveis, salvo cópias que alguém já tenha descarregado.

Opcionalmente configure `RESEND_API_KEY`, `MAIL_FROM` e `CONTACT_NOTIFY_EMAIL` para receber um aviso de mensagem nova. A mensagem completa fica na área privada. Uma falha na notificação não perde a mensagem nem transforma um envio persistido num erro. Não ative análise externa sem implementar o consentimento apropriado.

## Segurança e organização

- `src/app/(public)`: páginas renderizadas no servidor e metadados.
- `src/app/admin/(protected)`: dashboard e gestão autenticada.
- `src/app/admin/actions.ts`: validação e autorização de cada escrita; ações Next.js protegidas contra origens cruzadas.
- `src/lib/model.ts`: schemas Zod, datas de Lisboa e validação estrita de YouTube.
- `supabase/migrations`: permissões, triggers e histórico.
- `tests`: testes de domínio e RLS em PostgreSQL embebido.

RLS consulta o perfil ativo **e uma sessão ainda existente em `auth.sessions`**. Suspensão, alteração de perfil e revogação eliminam essas sessões numa transação. Um JWT antigo não recupera acesso direto à API. O trigger do último administrador usa bloqueio transacional. Editores não escrevem em perfis/configurações, nem leem auditoria de acessos. As mensagens não têm política pública de leitura ou escrita. Só o backend pode invocar a função limitada de receção.

Os conteúdos formatados aceitam parágrafos e negrito, renderizados como texto React; HTML e embeds arbitrários não são interpretados. Os ficheiros são decodificados com Sharp, limitados em bytes/píxeis e regravados como WebP sem metadados EXIF. SVG, GIF animado e ficheiros disfarçados são recusados. O ponto focal e o texto alternativo são editáveis e aplicados na apresentação.

O histórico não inclui mensagens recebidas. As revisões são privadas, conservam o autor e restauram como rascunho. O conteúdo editorial é arquivado em vez de apagado. Os tokens de convite são geridos pelo Supabase, não pelo histórico editorial.

## Backups e recuperação

1. Ative backups automáticos/PITR de PostgreSQL conforme o plano Supabase. Defina frequência, retenção e responsáveis com a igreja.
2. Faça exportações cifradas de `public` e das contas Auth pelo procedimento suportado do fornecedor. Um dump só das tabelas editoriais não restaura os acessos. Trate os backups como dados privados.
3. Copie separadamente o bucket Storage `media`: backups de PostgreSQL **não incluem os bytes dos ficheiros**. Preserve os caminhos UUID/small.webp e UUID/large.webp.
4. Faça uma recuperação de ensaio num projeto isolado: restaure esquema/migrations e dados com dependências, recupere Auth pelo procedimento do Supabase, depois copie os objetos Storage. Não volte a executar o seed numa base restaurada.
5. Atualize variáveis, URLs e SMTP no ambiente de ensaio. Confirme login, permissões e imagens antes de trocar a aplicação de produção.
6. Após incidente de segurança, rode os segredos, invalide sessões, reverifique os acessos e obrigue à recuperação de palavra-passe. Nunca publique dumps, `.env.local` ou ligações de recuperação.

## Verificação

```powershell
npm run typecheck
npm test
npm run build
```

O teste de base de dados aplica a migration real em PostgreSQL (PGlite), cria utilizadores/sessões de teste e executa consultas como `anon` e `authenticated`. Verifica separação de rascunhos, permissões do editor, suspensão com JWT antigo, proteção do último administrador e recuperação de versão. Não substitui a verificação do SMTP, templates Auth e Storage no projeto Supabase.

Consulte [guia da equipa](docs/GUIA-EQUIPA.md), [origem dos conteúdos](docs/CONTEUDOS.md) e [verificação de lançamento](docs/VERIFICACAO.md).
