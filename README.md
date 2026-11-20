# MyChurch · Missão aos Povos

Site e painel editorial em Next.js App Router, TypeScript e Tailwind. A stack de produção é **inteiramente Firebase/Google Cloud**, conforme a configuração escolhida pela igreja.

| Necessidade | Serviço |
| --- | --- |
| Site público e painel `/admin` | Firebase Hosting, com reescrita para Cloud Run |
| Eventos, páginas, textos, vídeos, versões e mensagens | Cloud Firestore |
| Login, ativação e recuperação | Firebase Authentication |
| Fotografias e versões WebP | Cloud Storage for Firebase |
| Convites, permissões e validação de escritas | Servidor Next.js no Cloud Run |

Projeto: `project-b8361f5e-fc32-4291-b37`. Conta técnica: `mychurch-runtime`. Região do servidor, Firestore e imagens: `europe-west4`. O plano Blaze está associado à conta autorizada e tem um alerta mensal de 5 EUR. **O alerta não interrompe cobranças superiores.** O servidor tem zero instâncias mínimas e duas máximas.

[Site publicado](https://project-b8361f5e-fc32-4291-b37.web.app) · [Painel](https://project-b8361f5e-fc32-4291-b37.web.app/admin) · [Consola Firebase](https://console.firebase.google.com/project/project-b8361f5e-fc32-4291-b37/overview). A [migração para a conta da igreja](docs/MIGRACAO-PROJETO.md) preservou os dados e acessos existentes; o endereço antigo redireciona para este site.

## Abrir localmente

Requer Node.js 22 e npm.

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Abra [localhost:3000](http://localhost:3000). Sem `FIREBASE_PROJECT_ID`, o site apresenta os exemplos identificados como demonstração e não simula login ou envio de mensagens. Com Firebase configurado, lê e escreve dados reais; erros do serviço não são escondidos por dados de exemplo.

Para desenvolvimento ligado ao projeto, preencha as variáveis e configure Application Default Credentials com a sua conta autorizada. Em produção o SDK Admin utiliza a identidade gerida do Cloud Run: não há chave de conta de serviço guardada no repositório ou no frontend.

## Conteúdos e equipa

Estão implementados: páginas estruturadas, secções opcionais, eventos com categorias/estados/arquivo e calendário ICS, ministérios, vídeos YouTube com consentimento, álbuns acessíveis, biblioteca de imagens, mensagens privadas, convites, suspensão/revogação, histórico e recuperação de versões.

Os exemplos não são informação institucional confirmada. Valide morada, horários, contactos, liderança, eventos, direitos das fotografias e minutas legais antes de assinalar a validação em Configurações. O formulário fica desativado até essa confirmação.

Leia o [guia da equipa](docs/GUIA-EQUIPA.md) e a [origem dos conteúdos](docs/CONTEUDOS.md). Imagens reais em alta resolução podem ser carregadas pelo painel; não se aplicou o ensaio de imagem gerada por IA.

## Segurança

- O registo público de utilizadores está desativado no Firebase Authentication. Apenas o servidor autorizado cria acessos.
- O login usa a API oficial Firebase e um cookie HttpOnly/Secure/SameSite `__session`, o único cookie encaminhado pelo Firebase Hosting. Um identificador de sessão e a versão do perfil são verificados no Firestore em cada acesso protegido.
- A suspensão altera imediatamente a versão/status do perfil, revoga tokens e desativa a conta Authentication. Sessões antigas deixam de ser aceites.
- Escritas de clientes diretos em Firestore e Storage são recusadas pelas regras. O servidor aplica autenticação, perfis e validação antes de usar o SDK Admin.
- Conteúdos publicados têm leitura pública. Rascunhos, revisões, mensagens, sessões e auditoria estão protegidos. Perfis são visíveis apenas ao próprio utilizador e a administradores autorizados.
- O último administrador ativo é protegido por uma transação sobre `system/access`. As permissões nunca dependem de botões escondidos.
- Cada alteração editorial grava uma versão privada com autor/data. A recuperação cria um rascunho e preserva o estado atual.
- Imagens só são gravadas após validação de tamanho, formato real e píxeis, e são regravadas em WebP sem EXIF. O bucket é privado; a rota de media verifica publicação ou sessão antes de servir bytes.
- O servidor limita tentativas de login/recuperação e mensagens; aceita texto seguro e negrito, sem HTML ou embeds arbitrários. O segredo HMAC fica no Secret Manager.

As regras não limitam um proprietário do projeto ou uma conta IAM administrativa: essas identidades técnicas são de confiança e devem ter poucos responsáveis. O SDK Admin ignora regras de clientes, pelo que as verificações em `staff()` e nos serviços de escrita são essenciais.

## Primeiro administrador e dados iniciais

Não existem palavras-passe predefinidas. Num projeto novo, com ADC e `.env.local` configurados:

```powershell
npm run seed
npm run bootstrap -- responsavel@dominio-da-igreja.pt
```

O seed recusa uma base com conteúdos. O bootstrap recusa um projeto com administrador ativo. O Firebase envia uma ligação pessoal de utilização única para definir a palavra-passe; depois o destinatário entra em `/admin`. A palavra-passe deve ter pelo menos 12 caracteres. Se o email expirar, use Recuperar acesso. Os administradores seguintes são convidados no painel.

Para manutenção local com um token Google temporário e sem guardar uma chave, o script `scripts/firebase-admin-task.mjs` aceita apenas `seed` e `bootstrap`, recebendo o token por stdin. Exige `FIREBASE_PROJECT_ID` explícito e, para enviar emails, a configuração pública em `.firebase/runtime-env.json`. O token nunca é impresso nem gravado.

## Testes e deploy

```powershell
npm run typecheck
npm test
npm run test:firebase
npm run build
```

Os testes de integração usam os emuladores oficiais Authentication/Firestore/Storage e exercitam sessões, regras e transações reais da aplicação. Em `npm test`, são omitidos quando os emuladores não estão ativos; `test:firebase` inicia-os com `firebase.emulators.json` e o projeto fictício `demo-mychurch`. Nenhum teste de emulador deve apontar para dados reais.

O [guia de Firebase](docs/FIREBASE.md) explica Cloud Build, Cloud Run e Hosting. A publicação não é uma exportação estática: o servidor continua a executar autenticação e APIs. Uma alteração de conteúdo publicada no painel fica disponível sem novo deployment.

## Backups e restauro

Defina retenção e responsáveis com a igreja. Firestore, Authentication e os bytes do Storage são conjuntos distintos: um export Firestore não inclui utilizadores Auth nem fotografias.

1. Configure backups agendados/PITR de Firestore conforme a retenção aprovada, considerando os custos no orçamento. Estas opções não são anunciadas como ativas apenas por existir um deploy.
2. Faça exports Firestore para um bucket de backup privado. Exporte separadamente Authentication pelo procedimento oficial Firebase e mantenha os parâmetros de hash como segredos.
3. Ative uma política de recuperação de objetos/versionamento ou cópias do bucket de imagens. Guarde os caminhos `media/UUID/small.webp` e `large.webp`.
4. Ensaie o restauro num projeto isolado: Auth, documentos e regras Firestore, imagens, IAM e segredos. Preserve os UIDs dos perfis e os IDs das imagens. O documento `system/access` deve corresponder aos administradores restaurados.
5. Após incidente, revogue sessões e tokens, rode segredos afetados e reveja membros/IAM. Não publique exports, tokens, ficheiros ADC ou dados pessoais.
