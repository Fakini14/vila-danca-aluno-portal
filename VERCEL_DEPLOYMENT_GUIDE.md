# Guia de Deploy na Vercel - Vila Dança Portal

## 🚀 Preparação Concluída

O projeto está pronto para deploy na Vercel com as seguintes otimizações implementadas:

### ✅ Configurações Implementadas

1. **vercel.json** - Configuração para SPA com React Router
2. **.env.production** - Variáveis de ambiente de produção
3. **.env.example** - Documentação das variáveis necessárias
4. **.gitignore** - Atualizado com arquivos da Vercel
5. **Code Splitting** - Rotas administrativas com lazy loading
6. **Build Otimizado** - Bundle dividido em chunks menores
7. **Variáveis de Ambiente** - Supabase client usando import.meta.env

### 📊 Melhorias de Performance

- **Antes**: Bundle único de 1.4MB
- **Depois**: Múltiplos chunks, maior com 409KB (charts)
- **Code Splitting**: Admin, Teacher e Student portals carregam sob demanda
- **Manual Chunks**: Vendor, UI, Forms e Utils separados

## 🔧 Como Fazer o Deploy

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy Inicial
```bash
vercel
```

Siga os prompts:
- Set up and deploy: **Y**
- Which scope: Selecione sua conta
- Link to existing project: **N**
- Project name: `vila-danca-aluno-portal`
- Directory: `./` (raiz do projeto)
- Override settings: **N**

### 3. Configurar Variáveis de Ambiente no Dashboard

Acesse [vercel.com/dashboard](https://vercel.com/dashboard) e configure:

#### Variáveis do Frontend:
```
VITE_SUPABASE_URL=https://eqhouenplcddjtqapurn.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_B2iX94YBWwsisISGC8xNTQ_m4luaIaY
```

### 4. Deploy para Produção
```bash
vercel --prod
```

## 🔐 Configuração do Supabase

### Edge Functions Secrets (Configure no Supabase Dashboard)

No [Supabase Dashboard](https://supabase.com/dashboard), vá em Settings > Edge Functions e configure:

```
ASAAS_API_KEY=seu_api_key_producao
ASAAS_WALLET_ID=seu_wallet_id
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_TOKEN=seu_token_webhook
```

### Deploy das Edge Functions
```bash
supabase functions deploy --project-ref eqhouenplcddjtqapurn
```

## 🔄 Após o Deploy

### 1. Atualizar Webhook do Asaas
- Acesse o painel do Asaas
- Configure webhook URL: `https://seu-dominio.vercel.app/api/webhooks/asaas`

### 2. Verificar CORS no Supabase
- No Supabase Dashboard > Authentication > URL Configuration
- Adicione seu domínio Vercel às URLs permitidas

### 3. Testar a Aplicação
- [ ] Login/Logout funcionando
- [ ] Rotas protegidas acessíveis
- [ ] Pagamentos processando
- [ ] Edge Functions respondendo

## 📝 Notas Importantes

### Segurança
- ✅ Usando nova chave `sb_publishable_` (JWT assimétrico)
- ✅ Service role key apenas nas Edge Functions
- ✅ Variáveis de ambiente não expostas no código

### Performance
- ✅ Lazy loading implementado
- ✅ Chunks otimizados
- ✅ Build minificado com esbuild

### Manutenção
- Para atualizar variáveis: Dashboard Vercel > Settings > Environment Variables
- Para redeploy: `git push` ou `vercel --prod`
- Logs: Dashboard Vercel > Functions > Logs

## 🆘 Troubleshooting

### Build falha na Vercel
- Verifique Node version (use 18.x ou superior)
- Confirme que `npm install` funciona localmente

### Erro 404 em rotas
- Confirme que `vercel.json` está na raiz
- Verifique rewrites configurados

### Autenticação não funciona
- Verifique variáveis de ambiente
- Confirme URLs no Supabase Auth settings

### Pagamentos não processam
- Verifique Edge Functions deployed
- Confirme secrets do Asaas configurados
- Teste webhook endpoint

## 📞 Suporte

Para problemas específicos:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- Asaas: Portal do cliente Asaas