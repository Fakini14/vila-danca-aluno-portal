# 🔄 Diagrama do Fluxo de Pagamento Asaas

## 📊 **Fluxo Visual Completo**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE PAGAMENTO ASAAS                          │
│                        (Já Implementado)                               │
└─────────────────────────────────────────────────────────────────────────┘

🧑‍🎓 ALUNO                    💻 SISTEMA                    💳 ASAAS

┌─────────┐
│ Acessa  │
│ Portal  │
│ Aluno   │
└────┬────┘
     │
     v
┌─────────┐                ┌─────────────────┐
│ Vê      │─────────────>  │ Lista turmas    │
│ Turmas  │                │ disponíveis     │
│ Disp.   │                │ (filtradas)     │
└─────────┘                └─────────────────┘
     │                              │
     v                              v
┌─────────┐                ┌─────────────────┐
│ Clica   │─────────────>  │ Valida dados    │
│"Assinar │                │ do estudante    │
│Mensald."│                │ (obrigatórios)  │
└─────────┘                └─────────────────┘
     │                              │
     │                              v
     │                     ┌─────────────────┐     ┌─────────────┐
     │                     │ Busca           │────>│ Cliente     │
     │                     │asaas_customer_id│     │ existe?     │
     │                     │ na tabela       │     │             │
     │                     │ students        │     └──────┬──────┘
     │                     └─────────────────┘            │
     │                              │                     │
     │                              v               ┌─────┴─────┐
     │                     ┌─────────────────┐      │    SIM    │
     │                     │ Cria matrícula  │      │           │
     │                     │ (ativa: false)  │      └─────┬─────┘
     │                     │ em enrollments  │            │
     │                     └─────────────────┘            │
     │                              │                     │
     │                              v                     │
     │              ┌─────────────────────────────┐       │
     │              │ Chama Edge Function         │       │
     │              │ create-subscription-checkout│       │
     │              └─────────────────────────────┘       │
     │                              │                     │
     │                              v                     │
     │              ┌─────────────────────────────┐       │
     │              │                             │       │
     │              │    PROCESSAMENTO ASAAS      │       │
     │              │                             │       │
     │              └─────────────────────────────┘       │
     │                              │                     │
     │                              v                     │
     │                     ┌─────────────────┐            │
     │                     │ Reutiliza       │<───────────┘
     │                     │ cliente         │
     │                     │ existente       │
     │                     └─────────────────┘
     │                              │
     │                              v
     │                ┌──────────────────────────────────────────┐
     │                │              NÃO                         │
     │                └──────────────────┬───────────────────────┘
     │                                   │
     │                                   v
     │                          ┌─────────────────┐
     │                          │ Busca por CPF   │
     │                          │ no Asaas        │
     │                          └─────────────────┘
     │                                   │
     │                                   v
     │                          ┌─────────────────┐
     │                          │ Encontrado?     │
     │                          └─────┬───────────┘
     │                                │
     │                    ┌───────────┴───────────┐
     │                    │                       │
     │                   SIM                     NÃO
     │                    │                       │
     │                    v                       v
     │           ┌─────────────────┐    ┌─────────────────┐
     │           │ Usa cliente     │    │ Cria novo       │
     │           │ encontrado      │    │ cliente         │
     │           └─────────────────┘    │ no Asaas        │
     │                    │             └─────────────────┘
     │                    │                       │
     │                    └───────┬───────────────┘
     │                            │
     │                            v
     │                   ┌─────────────────┐
     │                   │ Salva           │
     │                   │asaas_customer_id│
     │                   │ na tabela       │
     │                   │ students        │
     │                   └─────────────────┘
     │                            │
     │                            v
     │                   ┌─────────────────┐           ┌─────────────┐
     │                   │ Cria checkout   │─────────> │ Gera URL    │
     │                   │ de assinatura   │           │ checkout    │
     │                   │ recorrente      │           │ Asaas       │
     │                   └─────────────────┘           └─────────────┘
     │                            │                             │
     │                            v                             │
     │                   ┌─────────────────┐                   │
     │                   │ Retorna URL do  │<──────────────────┘
     │                   │ checkout para   │
     │                   │ frontend        │
     │                   └─────────────────┘
     │                            │
     │                            v
┌─────────┐               ┌─────────────────┐
│ Redirec.│<──────────────│ Redireciona     │
│ para    │               │ aluno para      │
│ Asaas   │               │ checkout Asaas  │
└─────────┘               └─────────────────┘
     │
     v
┌─────────┐               ┌─────────────────┐           ┌─────────────┐
│ Realiza │─────────────> │ Processa        │─────────> │ Envia       │
│ Pagam.  │               │ pagamento       │           │ webhook     │
│ Asaas   │               │                 │           │             │
└─────────┘               └─────────────────┘           └─────────────┘
     │                                                           │
     v                                                           │
┌─────────┐                                                     │
│ Retorna │                                                     │
│ ao      │                                                     │
│ Sistema │                                                     │
└─────────┘                                                     │
     │                                                           │
     v                                                           │
┌─────────┐               ┌─────────────────┐                   │
│ Vê      │<──────────────│ Exibe página    │                   │
│ Confir. │               │ /checkout/      │                   │
│Success  │               │ success         │                   │
└─────────┘               └─────────────────┘                   │
                                   │                            │
                                   v                            │
                          ┌─────────────────┐                   │
                          │                 │<──────────────────┘
                          │ WEBHOOK ASAAS   │
                          │                 │
                          └─────────────────┘
                                   │
                                   v
                          ┌─────────────────┐
                          │ Event:          │
                          │ PAYMENT_CREATED │
                          │ → Salva payment │
                          └─────────────────┘
                                   │
                                   v
                          ┌─────────────────┐
                          │ Event:          │
                          │ PAYMENT_        │
                          │ RECEIVED        │
                          └─────────────────┘
                                   │
                                   v
                          ┌─────────────────┐
                          │ É primeiro      │
                          │ pagamento?      │
                          └─────────────────┘
                                   │
                            ┌─────┴─────┐
                           SIM         NÃO
                            │            │
                            v            │
                   ┌─────────────────┐   │
                   │ ATIVA MATRÍCULA │   │
                   │ enrollment      │   │
                   │ .ativa = true   │   │
                   └─────────────────┘   │
                            │            │
                            v            │
                   ┌─────────────────┐   │
                   │ Atualiza        │   │
                   │ subscription    │   │
                   │ status='active' │   │
                   └─────────────────┘   │
                            │            │
                            └─────┬──────┘
                                  │
                                  v
                         ┌─────────────────┐
                         │ MATRÍCULA       │
                         │ ATIVA E         │
                         │ FUNCIONANDO!    │
                         └─────────────────┘
```

## 🎯 **Pontos-Chave do Fluxo**

### 1. **Validação Inteligente**
- Sistema verifica dados obrigatórios antes de prosseguir
- Exibe mensagens claras sobre campos faltantes
- Redireciona para perfil se necessário

### 2. **Reutilização de Clientes**
- Prioriza `asaas_customer_id` salvo na tabela
- Fallback: busca por CPF no Asaas
- Última opção: cria novo cliente

### 3. **Assinatura Recorrente**
- Checkout configurado para `MONTHLY`
- Primeira cobrança no dia da matrícula
- Renovação automática todo mês
- Multa e juros configurados

### 4. **Ativação Automática**
- Matrícula criada como `ativa: false`
- Webhook ativa após primeiro pagamento
- Sistema completamente automatizado

### 5. **Tratamento de Erros**
- Validação em cada etapa
- Mensagens user-friendly
- Logs detalhados para debugging

## 📋 **Estados dos Componentes**

### **StudentAvailableClasses**
```typescript
State Management:
- enrollingClass: string | null
- validatingStudent: string | null  
- validationError: string | null
```

### **Assinatura no Banco**
```typescript
Status Lifecycle:
- 'pending' → Aguardando primeiro pagamento
- 'active' → Pagamentos em dia
- 'overdue' → Pagamento em atraso
- 'cancelled' → Cancelada pelo usuário
```

### **Matrícula no Banco**  
```typescript
Status Lifecycle:
- ativa: false → Criada, aguardando pagamento
- ativa: true → Ativa após primeiro pagamento
```

## 🚀 **Automações Implementadas**

1. **Criação de Cliente**: Se não existe, cria automaticamente
2. **Salvamento de ID**: `asaas_customer_id` salvo para reutilização
3. **Ativação de Matrícula**: Automática no primeiro pagamento
4. **Renovação Mensal**: Assinatura renova automaticamente
5. **Tratamento de Atraso**: Status atualizado via webhook
6. **Histórico Completo**: Todos os pagamentos registrados

Este fluxo representa um sistema completo e profissional de gestão de assinaturas recorrentes, totalmente integrado com o Asaas e automatizado via webhooks.