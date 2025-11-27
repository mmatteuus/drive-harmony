# Drive Harmony

Portal web responsivo que coloca uma camada de UX em cima do seu Google Drive. Conecte com sua conta Google, navegue por pastas, pesquise, faça upload e download sem sair da aplicação.

## Funcionalidades
- Login com Google (Google Identity Services + Drive API v3)
- Listagem de arquivos/pastas com filtros por texto, tipo, data e tags (appProperties)
- Breadcrumb para navegar entre pastas
- Upload de arquivos com metadados personalizados
- Criação de pastas direto do dashboard
- Download e abertura no Google Drive
- Drawer de detalhes do arquivo
- Drawer de conta com uso de armazenamento (Drive bout.get)

## Configuração rápida
1. **Pré-requisitos**: Node.js 18+ e npm.
2. **Instalação**:
   `ash
   npm install
   `
3. **Variáveis de ambiente**: crie um arquivo .env na raiz com:
   `ash
   VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com
   # opcional: altere escopos se precisar
   # VITE_GOOGLE_SCOPES="https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
   `
4. **Rodar localmente**:
   `ash
   npm run dev
   `
5. **Build de produção**:
   `ash
   npm run build
   npm run preview
   `

## Como obter o Client ID do Google
1. Crie um projeto em [Google Cloud Console](https://console.cloud.google.com/).
2. Habilite **Google Drive API** e configure a tela de consentimento OAuth.
3. Crie um OAuth Client ID do tipo **Web application** com seus domínios/URLs de origem.
4. Copie o Client ID gerado e coloque na variável VITE_GOOGLE_CLIENT_ID.

## Estrutura
- src/pages – páginas (Login, Dashboard, NotFound)
- src/components/dashboard – componentes da área logada (grid, filtros, upload, detalhes, etc.)
- src/components/ui – componentes de base (shadcn/ui)
- public – favicon e arte de compartilhamento (og-image.svg)

## Segurança
- Tokens de acesso ficam apenas no navegador (localStorage) e são enviados direto à Google Drive API.
- Nenhum conteúdo de arquivo é armazenado pela aplicação.
- Você pode revogar o acesso a qualquer momento em https://myaccount.google.com/permissions.

Desenvolvido por MtsFerreira
