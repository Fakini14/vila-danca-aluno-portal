Acesso a documentação Asaas:
- https://docs.asaas.com/docs/visao-geral (para acessar o guia)
- https://docs.asaas.com/reference/comece-por-aqui (para acessar as referências, formato correto para chamadas API e visualizar todos os tipos de chamadas que existem)

ETAPA 1: Criar Edge Function para Gerar Checkout ✅

**Implementado:** Edge Function `create-subscription-checkout`
- Validações: student_id, class_id (UUID format)
- Verificações: student existe, class existe e ativa, já matriculado
- Resposta mock estruturada com dados reais do banco
- Testado todos cenários: IDs válidos/inválidos, já matriculado, turma inativa

ETAPA 2: Implementar Lógica Básica do Checkout ✅

**Implementado:** Lógica completa de enrollment pendente
- Campo `status` adicionado à tabela enrollments (pending/active/cancelled)
- Campos de tracking: checkout_token, checkout_url, checkout_created_at
- Lógica inteligente: detecta enrollment existente vs novo
- Parâmetro `create_enrollment` para controlar comportamento
- Mock checkout URL realista com token único

**Cenários Testados:**
- ✅ Criar novo enrollment pendente → gera checkout URL  
- ✅ Enrollment pendente existente → retorna dados existentes
- ✅ Estudante já matriculado → bloqueia com mensagem apropriada
- ✅ Apenas validação → não cria enrollment

**Status:** Funcional e deployada. Pronta para Etapa 3 (Integração Asaas).

ETAPA 3: Integração com Asaas (Sandbox)

ETAPA 4: Frontend - Botão de Matrícula

ETAPA 5: Páginas de Callback

ETAPA 6: Configurar Webhook Handler
