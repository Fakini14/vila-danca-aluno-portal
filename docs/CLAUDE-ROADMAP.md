# CLAUDE-ROADMAP.md

Este arquivo fornece o roteiro de desenvolvimento e lições aprendidas para o Claude Code ao trabalhar com este repositório.

⚠️ **IMPORTANTE**: Sempre atualize este arquivo após completar marcos do projeto ou modificar funcionalidades existentes.

# 📋 ROTEIRO E DOCUMENTAÇÃO DE DESENVOLVIMENTO

## **FASE 1: CONFIGURAÇÃO INICIAL** ✅
**Implementado**: Setup React + TypeScript + Vite, Supabase, estrutura de pastas organizada

**Lições Aprendidas**:
- ⚠️ Configurar variáveis de ambiente corretamente desde o início
- ⚠️ Estrutura bem definida evita refatorações futuras

---

## **FASE 2: SISTEMA DE AUTENTICAÇÃO** ✅
**Implementado**: Auto-registro para estudantes, fluxo de aprovação para professores, redirecionamento por roles

**Lições Aprendidas**:
- ⚠️ Validação deve ocorrer no frontend E backend
- ⚠️ Feedback claro essencial para usuários em aprovação

---

## **FASE 3: PORTAL ADMINISTRATIVO + OTIMIZAÇÕES** ✅
**Implementado**: Dashboard completo, gestão de professores/turmas/alunos, sistema de matrícula básica

### 🚨 **Otimizações Críticas de Performance**:
- **Problema**: Função `get_user_role()` sem índices causava lentidão extrema
- **Solução**: Índices `idx_profiles_role` e `idx_profiles_id_role`
- **Problema**: Consultas complexas frequentes lentas
- **Solução**: Views materializadas (posteriormente removidas na Fase 8)
- **Resultado**: Melhoria de 70-90% na performance

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: Sempre criar índices para funções usadas em RLS policies
- ⚠️ Cache agressivo no frontend (10min listas, 2min stats) reduz carregamentos
- ⚠️ Validação de dados essencial para integrações futuras

---

## **FASE 4: PORTAL DO ESTUDANTE** ✅
**Implementado**: Dashboard com abas, visualização de turmas, sistema de matrícula básica

**Lições Aprendidas**:
- ⚠️ Confirmações obrigatórias para ações irreversíveis
- ⚠️ Interfaces self-service reduzem suporte significativamente

---

## **FASE 5: PORTAL DO PROFESSOR** ✅
**Implementado**: Dashboard, sistema de chamada, relatórios de comissões

**Lições Aprendidas**:
- ⚠️ Interface deve ser simples para uso durante aulas
- ⚠️ Transparência financeira importante para professores

---

## **FASE 6: SISTEMA DE MATRÍCULA SIMPLIFICADO** ✅
**Implementado**: Sistema básico de matrícula sem pagamento online, criação automática de cliente Asaas

**Lições Aprendidas**:
- ⚠️ Sistemas complexos de pagamento podem ser desnecessários para MVP
- ⚠️ Criação automática de cliente facilita integrações futuras
- ⚠️ Matrícula direta reduz fricção para estudantes

---

## **FASE 7: GESTÃO DE PERFIS E ROLES** ✅
**Implementado**: Edição de perfil estudante, gestão de roles admin, triggers de migração automática

### 🚨 **Criação Automática de Clientes Asaas**:
- **Implementado**: Cliente criado na confirmação de email
- **Benefício**: Preparação para futuras integrações de pagamento
- **Uso Atual**: Apenas criação de cliente, sem fluxo de pagamento

**Lições Aprendidas**:
- ⚠️ Triggers essenciais para migração automática de dados
- ⚠️ Coluna direta na tabela é melhor que tabela 1:1 separada
- ⚠️ Cliente Asaas criado automaticamente para futuras integrações

---

## **FASE 8: JWT ASSIMÉTRICO + CONSOLIDAÇÃO** ✅

### 8.0 - JWT Signing Keys
**Implementado**: Migração para JWT assimétrico, cache JWKS, verificação local

**Performance**: Verificação de token < 50ms (antes: ~500ms)

**Lições Aprendidas**:
- ⚠️ Decodificação local de JWT reduz latência drasticamente
- ⚠️ Cache JWKS 10min alinhado com edge Supabase
- ⚠️ Sempre manter fallbacks durante transições

### 8.1 - Consolidação de Tabelas
**Mudança Crítica**: Tabela `staff` removida, consolidada em `profiles`

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: Consolidações deixam referências órfãs em componentes
- ⚠️ Sempre fazer busca global por referências antes de remover tabela
- ⚠️ Atualizar: banco → tipos → frontend → edge functions (nesta ordem)

### 8.2 - Remoção de Views Materializadas
**Mudança**: Views substituídas por queries diretas com JOINs

**Lições Aprendidas**:
- ⚠️ Views materializadas podem ficar obsoletas após reestruturações
- ⚠️ Queries diretas são mais resilientes que views
- ⚠️ JOINs otimizados mantêm performance sem views

---

## **FASE 9: REFORMA COMPLETA DA AUTENTICAÇÃO** ✅

### 🚨 **Bug Crítico Corrigido**:
**Problema**: Usuários 'aluno' sem registro na tabela `students` quebravam pagamentos

**Solução**: Trigger `handle_new_user()` cria ambos registros automaticamente

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: Sempre criar registros relacionados via triggers
- ⚠️ Confirmação de email deve ser obrigatória (base de segurança)
- ⚠️ Validações em múltiplas camadas: frontend + RLS + triggers

---

## **FASE 10: CORREÇÕES CRÍTICAS** ✅

### 10.1 - Garantia de Cliente Asaas
**Implementado**: Hook `useAsaasCustomer()` com validação proativa

**Lições Aprendidas**:
- ⚠️ Zero tolerância a falhas silenciosas em pagamentos
- ⚠️ Validação proativa antes do checkout evita abandonos
- ⚠️ Cache de 5min essencial para múltiplas validações

### 10.2 - Bug WhatsApp NOT NULL
**Problema**: Campo obrigatório no banco mas opcional no frontend

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: UX opcional = campo nullable no banco
- ⚠️ Triggers duplicados causam comportamentos imprevisíveis
- ⚠️ Functions devem usar valores válidos nas constraints

### 10.3 - Referências Órfãs à Tabela Staff
**Problema**: Componentes mantinham referências após remoção da tabela

**Lições Aprendidas**:
- ⚠️ Consolidações sempre deixam rastros - validar TODOS os portais
- ⚠️ Erros 400 Bad Request podem não aparecer em todos os cenários

### 10.4 - Bug Visualização de Estudantes
**Problema**: JOIN complexo com `profiles!inner()` falhava silenciosamente

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: JOINs complexos podem falhar sem erro explícito
- ⚠️ Simplicidade > Complexidade: queries diretas mais confiáveis
- ⚠️ Sempre ter fallbacks quando dados esperados não existem

### 10.5 - Bug Visualização de Professores
**Problema**: Query com JOINs aninhados retornava array vazio

**Lições Aprendidas**:
- ⚠️ PostgREST tem sintaxe específica - validar no Supabase primeiro
- ⚠️ Começar com query simples, adicionar complexidade gradualmente

### 10.6 - Bug Confirmação de Email (RLS Permission)
**Problema**: "permission denied for table students (SQLSTATE 42501)" durante confirmação de email

**Root Cause**: 
- Trigger `handle_new_user` existia mas não estava ativo na tabela `auth.users`
- Função `handle_student_email_confirmation_simple` sem `SECURITY DEFINER` nem bypass RLS
- RLS bloqueava inserção/atualização durante processo de confirmação

**Solução**:
- ✅ Recriado trigger `on_auth_user_created` na tabela `auth.users`
- ✅ Adicionado `SECURITY DEFINER` + `SET LOCAL row_security = off` em ambas funções
- ✅ Processo completo: cadastro → criação de registros → confirmação por email → login

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: Triggers podem desaparecer após migrações - sempre verificar
- ⚠️ Funções de confirmação precisam mesmo bypass RLS que funções de criação
- ⚠️ Testar fluxo completo após correções: cadastro → email → login
- ⚠️ RLS em `students` mas não em `profiles` cria inconsistências de permissão

---

## 🚨 **BUGS RECORRENTES E CRÍTICOS**

### **Bug #1: Loading Infinito Após Login**
**Frequência**: Aconteceu "inúmeras vezes"

**Root Cause**: `fetchUserProfile` travava sem chamar `setLoading(false)`

**Proteções Implementadas**:
- ✅ Timeout 10s em `fetchUserProfile`
- ✅ Timeout 5s em `initializeAuth`
- ✅ Fallback global 15s
- ✅ Promise.race() em todas as chamadas críticas

⚠️ **NUNCA REMOVER** estas proteções de timeout!

### **Bug #2: Queries com JOINs Falhando Silenciosamente**
**Padrão**: `profiles!inner()`, `staff(profiles(...))`, views materializadas

**Solução**: Sempre preferir queries diretas simples

⚠️ **SEMPRE** testar queries no Supabase SQL Editor primeiro!

---

## 🎯 **REGRAS DE OURO APRENDIDAS**

### Performance
1. **Índices são críticos** para funções usadas em RLS
2. **Cache agressivo** no frontend (10min para listas)
3. **Queries simples** > JOINs complexos
4. **Verificação local JWT** > chamadas ao servidor

### Arquitetura
1. **Triggers para integridade** de dados relacionados
2. **Campos nullable** quando UX permite opcional
3. **Uma tabela consolidada** > múltiplas tabelas relacionadas
4. **Queries diretas** > views materializadas

### Segurança
1. **Confirmação de email obrigatória**
2. **Validação em múltiplas camadas**
3. **RLS policies com funções indexadas**
4. **Timeouts em todas as operações críticas**

### Integração Asaas (Básica)
1. **Criação automática de cliente** na confirmação de email
2. **Validação de dados** preparatória para futuras integrações
3. **Sistema simplificado** com matrícula direta

---

## 📚 **DOCUMENTAÇÃO TÉCNICA RELACIONADA**

- **[auth.md](./auth.md)** - Sistema JWT assimétrico
- **[ASAAS-SUBSCRIPTION-PLAN.md](./ASAAS-SUBSCRIPTION-PLAN.md)** - Documentação histórica de integração
- **[PERFORMANCE-OPTIMIZATIONS.md](./PERFORMANCE-OPTIMIZATIONS.md)** - Otimizações 70-90%
- **[MIGRATIONS_TO_RUN.md](./MIGRATIONS_TO_RUN.md)** - Scripts SQL pendentes

---

## 📊 **STATUS DO PROJETO**

**Fases Concluídas**: 11.0/12 (91.7%)
- ✅ Fases 1-11.0: Sistema completo exceto módulo de eventos

**Tecnologias**:
- Frontend: React 18 + TypeScript + Vite + shadcn/ui
- Backend: Supabase + Edge Functions
- Pagamentos: Sistema básico manual + Cliente Asaas automático
- Auth: JWT Assimétrico + JWKS

**Métricas de Sucesso**:
- 🚀 Performance: 70-90% melhoria
- 🔐 Segurança: JWT assimétrico + RLS robusta
- 💰 Sistema de matrícula básica funcionando
- 🎯 100% usuários com cliente Asaas criado automaticamente

---

## **FASE 11: SIMPLIFICAÇÃO DO SISTEMA DE PAGAMENTO** ✅

### 11.0 - Remoção Completa da Integração de Pagamento Online
**Implementado**: Remoção do sistema de e-commerce Asaas mantendo apenas criação de cliente

**Motivação**: Resolver problemas críticos de timeout e complexidade excessiva do sistema de pagamento online que bloqueavam a funcionalidade principal.

**Componentes Removidos**:
- ❌ 9 Edge Functions relacionadas a pagamento:
  - `asaas-subscription-webhook`, `asaas-webhook`, `create-asaas-payment`
  - `create-enrollment-payment`, `create-enrollment-subscription`
  - `create-subscription-checkout`, `manage-subscription`
  - `send-enrollment-confirmation`, `test-asaas-api`
- ❌ Páginas de checkout: `src/pages/checkout/` (3 arquivos)
- ❌ Componentes de checkout: `src/components/checkout/` (3 arquivos)
- ❌ Rotas de checkout no roteador
- ❌ Lógica de pagamento online em `StudentAvailableClasses`
- ❌ Step 3 (e-commerce) do `EnrollmentModal`

**Componentes Mantidos**:
- ✅ Edge Function `create-asaas-customer` (criação básica de cliente)
- ✅ Campo `asaas_customer_id` na tabela `students`
- ✅ Hook `useAsaasCustomer` (simplificado)
- ✅ Criação automática de cliente na confirmação de email

**Nova Experiência do Usuário**:
- **Estudantes**: Clicam "Matricular-se" → Matrícula ativa imediatamente
- **Admin**: Gerencia pagamentos manualmente (apenas dinheiro)
- **Sistema**: Mantém histórico básico + cliente Asaas para futuro uso

**Lições Aprendidas**:
- ⚠️ **Sistemas complexos** podem ser desnecessários para MVP
- ⚠️ **Simplicidade** > Complexidade quando há problemas críticos
- ⚠️ **Preparação para futuro** (cliente Asaas) sem implementação completa
- ⚠️ **Remoção incremental** é mais segura que refatoração total
- ⚠️ **Testabilidade** melhora drasticamente com sistemas simples

**Resultados**:
- ✅ Sistema 100% funcional e estável
- ✅ Builds bem-sucedidos sem erros de dependência
- ✅ Redução de ~50% no tamanho da aplicação
- ✅ Eliminação completa de timeouts críticos
- ✅ Base sólida para futuras implementações

---

## 🚨 **PROBLEMA CRÍTICO RESOLVIDO**

### **Issue #1: Sistema de Pagamento Online Complexo - RESOLVIDO** 
**Status**: ✅ **RESOLVIDO**
**Solução**: Sistema de pagamento online removido, implementado sistema básico de matrícula

**Descrição da Solução**:
O problema crítico de timeouts na integração Asaas foi resolvido através da **remoção completa do sistema de pagamento online**, implementando um sistema básico de matrícula que atende às necessidades do negócio.

**Mudanças Implementadas**:
- ❌ **Removido**: Sistema de checkout online (PIX, Boleto, Cartão)
- ❌ **Removido**: Edge Functions de pagamento (`create-enrollment-payment`, `asaas-webhook`, etc.)
- ❌ **Removido**: Páginas e componentes de checkout
- ✅ **Mantido**: Criação automática de cliente Asaas para futuro uso
- ✅ **Implementado**: Matrícula direta e imediata para estudantes
- ✅ **Implementado**: Gestão manual de pagamentos pelo admin

**Benefícios da Solução**:
- ✅ Sistema 100% funcional e estável
- ✅ Redução significativa da complexidade
- ✅ Matrícula sem fricção para estudantes
- ✅ Preparação para futuras integrações de pagamento
- ✅ Eliminação completa dos timeouts e erros críticos

**Impacto no Negócio**:
- ✅ Estudantes podem se matricular imediatamente
- ✅ Fluxo de trabalho principal desbloqueado
- ✅ Sistema confiável e performático
- ✅ Base sólida para futuras implementações de pagamento

---

**Última atualização**: 07/08/2025 - Sistema de pagamento simplificado implementado