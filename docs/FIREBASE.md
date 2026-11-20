# Produção Firebase

## Recursos

- Projeto: `project-b8361f5e-fc32-4291-b37`.
- Conta Google administradora: `adportugal.pt.adm@gmail.com`; faturação da igreja `011B79-485995-66231C`.
- Site Hosting: `project-b8361f5e-fc32-4291-b37`; URL publicada: `https://project-b8361f5e-fc32-4291-b37.web.app`.
- Cloud Run: serviço `mychurch`, região `europe-west4`, Node.js 22, 1 CPU, 1 GiB, concorrência 20, mínimo 0 e máximo 2 instâncias.
- Firestore: base `(default)`, localização `europe-west4`.
- Storage: bucket privado `project-b8361f5e-fc32-4291-b37-media`, localização `europe-west4`.
- Conta runtime: `mychurch-runtime@project-b8361f5e-fc32-4291-b37.iam.gserviceaccount.com`.
- Conta build: `mychurch-build@project-b8361f5e-fc32-4291-b37.iam.gserviceaccount.com`.
- Secret Manager: `mychurch-contact-hash`, apenas para o servidor.
- Orçamento: alerta de 5 EUR/mês, com limiares de 50%, 90% e 100%. **Não é um corte automático nem um teto de gastos.**

O Firebase Hosting encaminha o tráfego para Cloud Run. A criação de acessos e a atribuição de perfis são executadas no servidor Next.js, sem necessidade de uma segunda aplicação Cloud Functions.

A migração e a configuração da origem preservada estão documentadas em [MIGRACAO-PROJETO.md](MIGRACAO-PROJETO.md). O endereço antigo encaminha para o novo. O projeto adicional `project-b8361f5e-fc32-42-6583e` não é o projeto de produção.

## Compilar e publicar

```powershell
gcloud builds submit --config=cloudbuild.yaml --service-account=projects/project-b8361f5e-fc32-4291-b37/serviceAccounts/mychurch-build@project-b8361f5e-fc32-4291-b37.iam.gserviceaccount.com --region=europe-west4 --project=project-b8361f5e-fc32-4291-b37 --async
```

Espere o build terminar com `SUCCESS`. O nome da imagem inclui o ID devolvido pelo Cloud Build. O Dockerfile usa `npm ci`, compila Next.js e executa o output standalone como utilizador sem privilégios. `.env`, dependências locais e credenciais estão excluídos do upload.

O Cloud Build passa o seu ID como `NEXT_DEPLOYMENT_ID` à compilação. O Next.js usa esse identificador nos pedidos de navegação e nos URLs dos ficheiros estáticos, evitando misturar o editor antigo com os ficheiros de uma nova publicação. Após uma falha de carregamento, a opção «Recarregar painel» faz uma navegação completa para a versão atual.

Publique a imagem no serviço Cloud Run mantendo a identidade e os limites acima. As variáveis de runtime são `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_WEB_API_KEY` e `NEXT_PUBLIC_SITE_URL`. A chave Web é configuração pública Firebase, usada pelo servidor para a API de Authentication. `CONTACT_HASH_SECRET` é referenciado a partir do Secret Manager, nunca passado em argumentos ou guardado no Git.

O URL canónico também é definido na compilação Docker pelo argumento `NEXT_PUBLIC_SITE_URL`. Se o domínio mudar, atualize esse argumento, as variáveis runtime, os domínios autorizados de Authentication e a lista `serverActions.allowedOrigins` do Next.js.

Após Cloud Run estar pronto:

```powershell
firebase deploy --only hosting,firestore:rules,firestore:indexes,storage --project project-b8361f5e-fc32-4291-b37
```

Em PowerShell, coloque a lista de `--only` entre aspas se executar o wrapper `.ps1`. O Hosting usa `pinTag` para associar o rollout à revisão Cloud Run atual. Os endpoints internos reservados `/__/auth/` continuam a ser servidos pelo Firebase para os emails de ativação/recuperação.

## IAM e dados privados

As permissões do runtime estão limitadas ao MyChurch: Firestore para os conteúdos, gestão de utilizadores Authentication, operações de objetos no bucket de imagens e leitura do segredo HMAC. A identidade de build tem as permissões necessárias para ler fontes, escrever a imagem e registar logs. Não reutilize estas contas noutros projetos.

As regras Firestore e Storage estão nos ficheiros `firestore.rules` e `storage.rules`. Não publique regras permissivas durante testes. Storage não aceita uploads diretos: passam pela rota validada do servidor. Os documentos de media controlam referências publicadas e impedem eliminar imagens utilizadas.

## Authentication

Email/palavra-passe ativo, registo público e eliminação pelo cliente desativados. A política exige pelo menos 12 caracteres. Convites e recuperação usam o serviço de emails Firebase; o destinatário define a palavra-passe na página de ação oficial e entra depois em `/admin`. Nunca partilhe os links de ação ou os tokens.

O cookie `__session` contém o cookie de sessão Firebase e um nonce aleatório. O servidor valida ambos, revogação Auth, perfil ativo e versão da sessão no Firestore. Os documentos de sessões e limitação de pedidos têm expiração TTL; a expiração lógica é sempre verificada, mesmo que a eliminação TTL ocorra mais tarde.

## Verificações

Confirme HTTP 200, `/admin` sem sessão a encaminhar para login, sitemap/canonicals para o domínio HTTPS, bloqueio de signup, ativação dos dois administradores, edição/publicação e uploads. Verifique o último rollout e a revisão efetivamente fixada no Hosting. A existência de um build não prova que o serviço está publicado.

Referências oficiais: [Hosting com Cloud Run](https://firebase.google.com/docs/hosting/cloud-run), [cookies no Hosting](https://firebase.google.com/docs/hosting/manage-cache), [sessões Authentication](https://firebase.google.com/docs/auth/admin/manage-cookies), [regras Firestore](https://firebase.google.com/docs/firestore/security/get-started).
