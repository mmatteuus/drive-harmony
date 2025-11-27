# Drive Premium - Instruções de Configuração

## 🚀 Configuração do Google Cloud

Para que a aplicação funcione, você precisa configurar um projeto no Google Cloud Console e obter as credenciais OAuth 2.0.

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Select a project" → "New Project"
3. Dê um nome ao projeto (ex: "Drive Premium")
4. Clique em "Create"

### Passo 2: Habilitar as APIs

1. No menu lateral, vá em "APIs & Services" → "Library"
2. Procure e habilite as seguintes APIs:
   - **Google Drive API**
   - **Google+ API** (para informações do usuário)

### Passo 3: Configurar Tela de Consentimento OAuth

1. Vá em "APIs & Services" → "OAuth consent screen"
2. Escolha "External" e clique em "Create"
3. Preencha as informações obrigatórias:
   - **App name**: Drive Premium
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Em "Scopes", adicione os seguintes escopos:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/userinfo.email`
5. Salve e continue

### Passo 4: Criar Credenciais OAuth 2.0

1. Vá em "APIs & Services" → "Credentials"
2. Clique em "Create Credentials" → "OAuth client ID"
3. Escolha "Web application"
4. Configure:
   - **Name**: Drive Premium Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:8080` (para desenvolvimento)
     - Adicione sua URL de produção quando fizer deploy
   - **Authorized redirect URIs**: 
     - `http://localhost:8080` (para desenvolvimento)
     - Adicione sua URL de produção quando fizer deploy
5. Clique em "Create"
6. **IMPORTANTE**: Copie o **Client ID** que aparece

### Passo 5: Adicionar o Client ID na Aplicação

1. Abra o arquivo `src/pages/Login.tsx`
2. Procure por `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
3. Substitua por seu Client ID real em **DUAS** linhas:
   - Linha ~32: `client_id: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"`
   - Linha ~55: `client_id: "SEU_CLIENT_ID_AQUI.apps.googleusercontent.com"`

## 🎨 Funcionalidades Implementadas

✅ Login com Google (OAuth 2.0)  
✅ Listagem de arquivos e pastas  
✅ Navegação por breadcrumbs  
✅ Upload de arquivos com tags  
✅ Download de arquivos  
✅ Busca e filtros por tipo  
✅ Detalhes de arquivos  
✅ Design responsivo (mobile/tablet/desktop)  
✅ Interface premium com animações  

## 🔒 Segurança

- Os tokens de acesso são armazenados no localStorage do navegador
- A aplicação **não** armazena o conteúdo dos seus arquivos
- Todo acesso ao Drive é feito diretamente via Google Drive API
- Você pode revogar o acesso a qualquer momento nas configurações da sua conta Google

## 📱 Como Usar

1. Acesse a aplicação
2. Clique em "Entrar com Google"
3. Autorize o acesso ao Google Drive
4. Navegue pelos seus arquivos!

## 🛠️ Desenvolvimento

```bash
# A aplicação já está rodando no Lovable
# Após configurar o Client ID, ela estará pronta para uso!
```

## 📝 Notas Importantes

- **Modo de Teste**: Enquanto seu app estiver em teste no Google Cloud, apenas usuários que você adicionar como "test users" poderão fazer login
- **Publicação**: Para permitir que qualquer pessoa use, você precisa publicar o app no Google Cloud Console (OAuth consent screen → Publish App)
- **Escopos**: O app usa apenas permissões necessárias para acessar arquivos criados/abertos pelo próprio app

## 🆘 Problemas Comuns

### "Error: invalid_client"
- Verifique se o Client ID está correto no código
- Verifique se a URL está nas "Authorized JavaScript origins"

### "Error: redirect_uri_mismatch"  
- Adicione a URL atual nas "Authorized redirect URIs" no Google Cloud Console

### Usuário não consegue fazer login
- Adicione o usuário como "test user" na tela de consentimento OAuth
- OU publique o aplicativo para produção

## 🚀 Deploy

Quando fizer deploy da aplicação:
1. Adicione a URL de produção nas "Authorized JavaScript origins"
2. Adicione a URL de produção nas "Authorized redirect URIs"
3. Atualize o Client ID no código se necessário

---

**Desenvolvido por MtsFerreira**
