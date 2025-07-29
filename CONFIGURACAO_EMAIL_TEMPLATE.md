# Configuração do Template de Email - Supabase

## ⚠️ IMPORTANTE: Template de Email Personalizado

Para o sistema de autenticação funcionar corretamente, você DEVE configurar o template de email personalizado no Supabase Dashboard.

### Passos para Configuração:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Faça login na sua conta
   - Selecione o projeto: `eqhouenplcddjtqapurn`

2. **Navegue para Email Templates**
   - No menu lateral, vá em **Authentication** → **Email Templates**
   - Ou acesse diretamente: https://supabase.com/dashboard/project/eqhouenplcddjtqapurn/auth/templates

3. **Configure o Template "Confirm signup"**
   - Clique em **"Confirm signup"**
   - Substitua o conteúdo do template pelo seguinte:

```html
<h2>Confirme seu cadastro</h2>

<p>Olá!</p>

<p>Bem-vindo ao <strong>Espaço Vila Dança & Arte</strong>!</p>

<p>Para ativar sua conta, clique no link abaixo:</p>

<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" 
     style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
    Confirmar Email
  </a>
</p>

<p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
<p style="word-break: break-all;">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</p>

<p>Este link expira em 24 horas por segurança.</p>

<p>Se você não solicitou este cadastro, pode ignorar este email.</p>

<hr>
<p style="color: #666; font-size: 12px;">
  Espaço Vila Dança & Arte<br>
  Sistema de Gerenciamento de Alunos
</p>
```

4. **Salve as Alterações**
   - Clique em **"Save"** ou **"Salvar"**

### Verificação da Configuração:

Após configurar o template, o fluxo funcionará assim:

1. **Usuário se cadastra** → Sistema envia email com link personalizado
2. **Usuário clica no link** → Redirecionado para `/auth/confirm`
3. **Sistema processa token** → Confirma email automaticamente
4. **Usuário é redirecionado** → Para o dashboard com sessão ativa

### Configuração Alternativa via API (Opcional):

Se preferir configurar via API, use este comando (substitua os tokens):

```bash
# Configure suas variáveis
export SUPABASE_ACCESS_TOKEN="seu-token-de-acesso"
export PROJECT_REF="eqhouenplcddjtqapurn"

# Atualize o template
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_subjects_confirmation": "Confirme seu cadastro - Espaço Vila Dança & Arte",
    "mailer_templates_confirmation_content": "<h2>Confirme seu cadastro</h2><p>Olá!</p><p>Bem-vindo ao <strong>Espaço Vila Dança & Arte</strong>!</p><p>Para ativar sua conta, clique no link abaixo:</p><p><a href=\"{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email\" style=\"display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;\">Confirmar Email</a></p><p>Se o botão não funcionar, copie e cole este link no seu navegador:</p><p style=\"word-break: break-all;\">{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email</p><p>Este link expira em 24 horas por segurança.</p><p>Se você não solicitou este cadastro, pode ignorar este email.</p><hr><p style=\"color: #666; font-size: 12px;\">Espaço Vila Dança & Arte<br>Sistema de Gerenciamento de Alunos</p>"
  }'
```

## 🔍 Debug e Troubleshooting

### Erro "server_error" ou "Error confirming user":

Este erro indica que o template de email padrão ainda está sendo usado. **SOLUÇÃO:**

1. **Configure o template personalizado** seguindo as instruções acima
2. **OU** aguarde - o sistema agora tenta processar mesmo com server_error
3. **Limpe o cache do navegador** após configurar o template

### Se ainda houver problemas:

1. **Verifique o console do navegador** para logs detalhados
2. **Confirme se o template foi salvo** corretamente no Dashboard
3. **Teste com email real** (não temporary/10minutemail)
4. **Verifique spam/lixo eletrônico** do email
5. **Aguarde alguns minutos** após configurar o template (cache do Supabase)

### Logs Importantes:

O sistema agora possui logs detalhados que aparecem no console:
- `SignUp attempt:` - Dados enviados para o Supabase
- `SignUp response:` - Resposta do Supabase
- `Confirm page - Parameters received:` - Parâmetros na página de confirmação
- `Supabase verifyOtp response:` - Resultado da verificação

---

**✅ Após configurar o template, o sistema de autenticação estará completamente funcional!**