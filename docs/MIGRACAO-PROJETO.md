# Migração para o projeto da igreja

Estado: migração concluída em 20 de novembro de 2026. Projeto ativo: `project-b8361f5e-fc32-4291-b37`; conta administradora: `adportugal.pt.adm@gmail.com`.

- Origem: `mychurch-kelsonflow`.
- Destino indicado pelo responsável: `project-b8361f5e-fc32-4291-b37`, na organização apresentada como `adportugal-pt-adm-org`.
- A origem foi mantida durante a validação. Após a sincronização final, o Cloud Run antigo ficou sem invocação pública e o Hosting antigo passou a redirecionar para o novo. Os dados antigos foram preservados para recuperação.

## Resultado verificado

- Site: `https://project-b8361f5e-fc32-4291-b37.web.app`.
- Painel: `https://project-b8361f5e-fc32-4291-b37.web.app/admin`.
- Firebase Web App: `1:216062947807:web:f674425f581ee87727546a`.
- Conta de faturação da igreja: `011B79-485995-66231C`, ativa, EUR. Alerta mensal de 5 EUR associado apenas ao projeto novo; não limita cobranças.
- Firestore: 62 documentos persistentes, com IDs, configurações e relações preservados. Sessões e limites temporários não foram copiados.
- Storage: 8 objetos, com contagens, tamanho e MD5 coincidentes.
- Authentication: 2 contas, UIDs e palavras-passe existentes preservados; hashes e parâmetros SCRYPT tratados só em memória.
- Runtime: `mychurch-runtime@project-b8361f5e-fc32-4291-b37.iam.gserviceaccount.com`.
- Build: `mychurch-build@project-b8361f5e-fc32-4291-b37.iam.gserviceaccount.com`.
- Cloud Run: `mychurch`, `europe-west4`, revisão `mychurch-00001-fjc`, mínimo 0 e máximo 2 instâncias.
- Artifact Registry: `europe-west4-docker.pkg.dev/project-b8361f5e-fc32-4291-b37/mychurch`.
- Build: `145a70dd-1f03-480c-a4ee-b00b9b4dbe65`, com URL canónico do destino.
- Regras Firestore e Storage e configuração de índices/TTL publicadas no destino.
- 23 verificações HTTP aprovadas no novo Hosting. Logótipo, ícone, bloqueio de perfis privados e geração/validação de recuperação de acesso também verificados.
- Projeto adicional criado durante a configuração: `project-b8361f5e-fc32-42-6583e`. Não recebeu dados nem foi usado no deploy.

Os utilizadores devem iniciar sessão no endereço novo com os seus dados habituais. As sessões antigas não são válidas entre projetos.

### Configurações locais de publicação

`firebase.json`, `firebase.church.json` e o alias padrão apontam para o destino. `firebase.legacy.json` guarda a configuração de publicação anterior e `firebase.legacy-redirect.json` mantém o redirecionamento. Repor o serviço antigo exigiria também voltar a permitir invocação pública no Cloud Run da origem; não executar esse procedimento durante a operação normal do novo site.

O script `scripts/migrate-project.mjs` usa credenciais OAuth de ambas as contas pelo stdin. Não persiste tokens nem parâmetros SCRYPT. Um manifesto de progresso ignorado pelo Git fica em `.firebase/migration/`, com hashes de integridade e precondições para impedir sobrescritas concorrentes. A verificação de origem/destino é própria do momento de migração; depois de novas edições no destino, os dois projetos deixam de ser réplicas idênticas.

## Plano utilizado

Confirmar a identidade autenticada, o ID/número do projeto, permissões e faturação já associada. Inventariar os serviços, bases de dados, utilizadores, buckets, sites e dados existentes em ambos os projetos. Não substituir dados existentes no destino sem avaliar conflitos. Não associar automaticamente a conta de faturação Narration ao projeto da igreja.

## Recursos a preparar

Firebase Hosting, Cloud Run, Firestore, Firebase Authentication, Cloud Storage, Secret Manager, Artifact Registry, Cloud Build e as permissões mínimas das contas de runtime/build. Preservar as regras de acesso, política de palavras-passe, bloqueio do registo público, limites de instâncias e domínios autorizados. Verificar também os alertas de orçamento do projeto de destino.

A compilação aceita `_SITE_URL` para definir o URL canónico e usa agora o destino como padrão. A lista explícita de origens das Server Actions inclui os dois domínios Firebase do destino.

## Dados e acessos

Migrar os conteúdos atuais, configurações, perfis, mensagens, histórico, referências de imagens e demais dados persistentes. Não executar o seed de demonstração nem recriar administradores como substituto dos dados atuais. Preservar os IDs dos documentos e dos utilizadores para manter as relações entre conteúdos, imagens e permissões.

Importar as contas Authentication com os parâmetros de hash corretos para preservar as palavras-passe. Não guardar tokens, hashes ou chaves de assinatura no Git ou em logs. As sessões do projeto anterior não autenticam no novo projeto; os utilizadores terão de voltar a iniciar sessão.

Copiar os objetos das imagens mantendo os caminhos e verificar a integridade. O bucket de destino continua privado; imagens públicas continuam a passar pelas verificações do servidor. Preparar o segredo do formulário no Secret Manager do destino.

## Publicação e transição

Publicar primeiro o destino e verificar páginas, logótipo, imagens, ícones, login, criação/edição/publicação, uploads, permissões e proteção dos rascunhos. Antes da transição definitiva, impedir novas alterações na origem durante a sincronização final para não perder edições. Confirmar novamente contagens e integridade dos dados e só então encaminhar os acessos para o novo site.

Não apagar automaticamente o projeto de origem, os seus utilizadores ou os seus dados. Registar o novo URL, projeto, bucket, identidades, revisão e resultado das verificações quando a migração estiver concluída.
