# Domínio da igreja

## Estado em 20 de novembro de 2026

Domínio indicado nos dados fornecidos: `adportugal.com.pt`, com gestão na Registar.pt. O endereço principal deverá abrir o site público; o painel ficará em `/admin/login`.

As consultas públicas devolveram `NXDOMAIN` para A, NS e MX. A consulta ao WHOIS `whois.dns.pt` devolveu `adportugal.com.pt - No Match`. É necessário confirmar o registo/renovação e a delegação do domínio antes de publicar os registos DNS.

Os domínios `adportugal.com.pt` e `www.adportugal.com.pt` já foram adicionados ao Firebase Hosting do projeto `project-b8361f5e-fc32-4291-b37`. O segundo está configurado para redirecionar para o primeiro. Ambos aguardam prova de propriedade, DNS e emissão de certificado. Não estão ativos.

O site continua publicado em `https://project-b8361f5e-fc32-4291-b37.web.app`. O domínio personalizado ainda não foi definido como URL canónico, nem autorizado no Authentication, para manter a configuração atual operacional enquanto a propriedade do domínio não está verificada.

## Registos solicitados pelo Firebase

Valores obtidos pela API do Firebase Hosting para este site:

| Nome na zona adportugal.com.pt | Tipo | Valor |
| --- | --- | --- |
| `@` | `A` | `199.36.158.100` |
| `@` | `TXT` | `hosting-site=project-b8361f5e-fc32-4291-b37` |
| `www` | `CNAME` | `project-b8361f5e-fc32-4291-b37.web.app` |

Antes de aplicar, voltar a consultar `requiredDnsUpdates` do Firebase e verificar eventuais registos concorrentes. Preservar registos de correio e outros serviços do domínio. A prova de propriedade TXT deve permanecer na zona para permitir a manutenção do HTTPS.

Os desafios ACME, quando necessários, são temporários: consultar os valores atuais em `cert.verification.dns` ou usar a validação HTTP automática do Firebase após o apontamento. Não reutilizar valores de desafio antigos.

## Concluir após confirmação do domínio

1. Confirmar que o domínio correto está registado e tem servidores DNS autoritativos acessíveis.
2. Publicar os registos no painel DNS que efetivamente serve a zona.
3. Verificar o estado de propriedade, alojamento e certificado no Firebase para ambos os nomes.
4. Acrescentar os domínios verificados à lista explícita de origens das Server Actions e aos domínios autorizados do Firebase Authentication.
5. Atualizar `NEXT_PUBLIC_SITE_URL` na compilação e no runtime para `https://adportugal.com.pt`, mantendo as configurações alinhadas.
6. Publicar a nova compilação no Cloud Run e fixar a revisão no Firebase Hosting.
7. Testar site público, imagens, ícone, login, recuperação, edição/publicação e redirecionamento de `www`.

Nenhuma palavra-passe, login do fornecedor ou dado de acesso do documento fornecido deve ser guardado no repositório.

Referência: [domínio personalizado no Firebase Hosting](https://firebase.google.com/docs/hosting/custom-domain).
