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
**Implementado**: Dashboard completo, gestão de professores/turmas/alunos, sistema financeiro Asaas, e-commerce checkout

### 🚨 **Otimizações Críticas de Performance**:
- **Problema**: Função `get_user_role()` sem índices causava lentidão extrema
- **Solução**: Índices `idx_profiles_role` e `idx_profiles_id_role`
- **Problema**: Consultas complexas frequentes lentas
- **Solução**: Views materializadas (posteriormente removidas na Fase 8)
- **Resultado**: Melhoria de 70-90% na performance

**Lições Aprendidas**:
- ⚠️ **CRÍTICO**: Sempre criar índices para funções usadas em RLS policies
- ⚠️ Cache agressivo no frontend (10min listas, 2min stats) reduz carregamentos
- ⚠️ Webhooks devem sempre retornar 200 para evitar retry
- ⚠️ Validação de CPF rigorosa para API Asaas

---

## **FASE 4: PORTAL DO ESTUDANTE** ✅
**Implementado**: Dashboard com abas, visualização de turmas, sistema de matrículas, gestão de assinaturas

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

## **FASE 6: ASSINATURAS RECORRENTES ASAAS** ✅
**Implementado**: Sistema completo de assinaturas mensais, webhooks automáticos, portal de gestão

**Lições Aprendidas**:
- ⚠️ Sincronização Asaas-banco local é complexa - usar delays
- ⚠️ Webhooks SEMPRE retornar 200 mesmo em erro
- ⚠️ CPF deve ser validado rigorosamente antes de enviar
- ⚠️ Fallbacks gracious essenciais para latência de API

---

## **FASE 7: GESTÃO DE PERFIS E ROLES** ✅
**Implementado**: Edição de perfil estudante, gestão de roles admin, triggers de migração automática

### 🚨 **Criação Automática de Clientes Asaas**:
- **Implementado**: Cliente criado na confirmação de email
- **Benefício**: Checkouts instantâneos com customer ID em cache

**Lições Aprendidas**:
- ⚠️ Triggers essenciais para migração automática de dados
- ⚠️ Coluna direta na tabela é melhor que tabela 1:1 separada
- ⚠️ Cache de customer ID crítico para performance de checkout

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

### Integração Asaas
1. **CPF validado rigorosamente**
2. **Customer ID em cache para checkouts**
3. **Webhooks sempre retornam 200**
4. **Delays para sincronização**

---

## 📚 **DOCUMENTAÇÃO TÉCNICA RELACIONADA**

- **[auth.md](./auth.md)** - Sistema JWT assimétrico
- **[ASAAS-SUBSCRIPTION-PLAN.md](./ASAAS-SUBSCRIPTION-PLAN.md)** - Integração pagamentos
- **[PERFORMANCE-OPTIMIZATIONS.md](./PERFORMANCE-OPTIMIZATIONS.md)** - Otimizações 70-90%
- **[MIGRATIONS_TO_RUN.md](./MIGRATIONS_TO_RUN.md)** - Scripts SQL pendentes

---

## 📊 **STATUS DO PROJETO**

**Fases Concluídas**: 10.6/11 (96.4%)
- ✅ Fases 1-10.6: Sistema completo exceto módulo de eventos

**Tecnologias**:
- Frontend: React 18 + TypeScript + Vite + shadcn/ui
- Backend: Supabase + Edge Functions
- Pagamentos: Asaas (PIX, Boleto, Cartão)
- Auth: JWT Assimétrico + JWKS

**Métricas de Sucesso**:
- 🚀 Performance: 70-90% melhoria
- 🔐 Segurança: JWT assimétrico + RLS robusta
- 💰 Assinaturas recorrentes funcionando
- 🎯 100% matrículas com cliente Asaas válido

---

## 🚨 **PROBLEMA CRÍTICO NÃO RESOLVIDO**

### **Issue #1: Sistema de Matrícula de Estudantes - BLOQUEIO TOTAL**
**Status**: 🔴 **CRÍTICO - NÃO RESOLVIDO**
**Impacto**: Sistema de pagamento completamente inoperante

**Descrição do Problema**:
Estudantes não conseguem completar matrículas devido a timeouts/erros de rede na Edge Function ao criar checkout Asaas.

**Detalhes Técnicos**:
- **Erro Frontend**: "Failed to send a request to the Edge Function" (FunctionsFetchError)
- **Edge Function**: `create-subscription-checkout` apresenta timeouts e crashes
- **Status HTTP**: 502/500 retornados pela função
- **Timeout**: Ocorre mesmo com limite de 30 segundos
- **Ambiente**: Afeta desenvolvimento local (localhost)
- **Possível Causa**: Integração ASAAS API ou consultas ao banco

**Tentativas de Correção (FALHARAM)**:
1. ✅ Corrigido problemas de callback URL (detecção localhost implementada)
2. ✅ Adicionados timeouts abrangentes a todas operações HTTP
3. ✅ Melhorado logging e debugging
4. ✅ Atualizado Edge Function para versão 19 com tratamento de erro aprimorado
5. ❌ **PROBLEMA PERSISTE** - função continua com timeout durante execução

**Impacto no Negócio**:
- 🚫 Estudantes não conseguem se matricular em aulas
- 🚫 Sistema de pagamento totalmente não funcional
- 🚫 Fluxo de trabalho principal do negócio bloqueado
- 🚫 Receita comprometida

**Próximos Passos Necessários**:
- 🔍 Investigação profunda do ambiente de execução da Edge Function
- 🔄 Possível simplificação da integração ASAAS
- 🏗️ Considerar arquitetura alternativa para fluxo de pagamento
- 🧪 Teste em ambiente de produção Supabase (não localhost)
- 📊 Análise de logs detalhados da Edge Function

**Prioridade**: **MÁXIMA** - Bloqueia funcionalidade central do sistema

---

**Última atualização**: 07/08/2025