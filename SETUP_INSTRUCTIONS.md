# Drive Harmony - Instruções de Configuração

## 1) Configuração do Google Cloud

### Passo 1: Criar projeto no Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" → "New Project"
3. Dê um nome ao projeto (ex.: "Drive Harmony") e crie.

### Passo 2: Habilitar APIs
1. Em "APIs & Services" → "Library"
2. Habilite:
   - **Google Drive API**
   - **People API** (para dados básicos do usuário)

### Passo 3: Tela de Consentimento OAuth
1. Em "APIs & Services" → "OAuth consent screen"
2. Tipo: "External"
3. Preencha:
   - App name: Drive Harmony
   - User support email / Developer contact: seu e-mail
4. Escopos sugeridos:
   - https://www.googleapis.com/auth/drive.file
   - https://www.googleapis.com/auth/userinfo.profile
   - https://www.googleapis.com/auth/userinfo.email

### Passo 4: Criar Credenciais OAuth 2.0
1. Em "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID"
2. Tipo: **Web application**
3. Configure os domínios/URLs permitidos:
   - **Authorized JavaScript origins**: http://localhost:5173 (dev) + sua URL de produção
   - **Authorized redirect URIs**: http://localhost:5173 (dev) + sua URL de produção
4. Salve e copie o **Client ID** gerado.

### Passo 5: Aplicação
1. Crie um .env na raiz com:
   `ash
   VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID.apps.googleusercontent.com
   # opcional: altere escopos se precisar
   # VITE_GOOGLE_SCOPES="https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
   `
2. Rode 
pm run dev e faça login com sua conta Google.

## 2) Funcionalidades Entregues
- Login com Google (OAuth 2.0 - token client)
- Lista e navegação por pastas (breadcrumbs)
- Busca por texto, tipo, datas e tags (appProperties)
- Upload de arquivos com metadados
- Download e link direto no Drive
- Criação de pastas
- Drawer de detalhes do arquivo
- Drawer de conta com uso de armazenamento do Drive
- Layout responsivo (mobile/tablet/desktop)

## 3) Uso
1. Acesse a aplicação
2. Clique em **Entrar com Google**
3. Autorize o acesso ao Google Drive
4. Navegue, filtre, envie ou baixe arquivos

## 4) Notas
- Enquanto o app estiver em modo de teste, só "test users" adicionados na tela de consentimento podem autenticar.
- Para liberar para todos, publique o app na tela de consentimento OAuth.
- Tokens ficam apenas no navegador; o conteúdo dos arquivos permanece no seu Google Drive.

Desenvolvido por MtsFerreira
