# CLAUDE-ROADMAP.md

Este arquivo fornece o roteiro de desenvolvimento para o Claude Code (claude.ai/code) ao trabalhar com o código neste repositório.

⚠️ IMPORTANTE: Sempre atualize este arquivo após:
- Completar um marco/milestone do projeto
- Modificar funcionalidades já implementadas na base de código
- Alterar a arquitetura ou tecnologias utilizadas
- Adicionar novos recursos ou componentes

Este documento serve como a documentação oficial do roadmap do projeto e deve refletir fielmente o estado atual e os próximos passos do desenvolvimento.

# 📋 ROTEIRO E DOCUMENTAÇÃO DE DESENVOLVIMENTO

## **FASE 1: CONFIGURAÇÃO INICIAL E SETUP**
**Status: ✅ CONCLUÍDA**

### Checklist de Implementação:
- **1.1** Configuração base do projeto React + TypeScript + Vite
- **1.2** Instalação de dependências principais:
  - @supabase/supabase-js
  - @tanstack/react-query
  - date-fns
  - react-hook-form
  - zod
  - lucide-react
  - sonner (para toasts)
- **1.3** Configuração do Supabase (projeto, URL, ANON KEY)
- **1.4** Estrutura de pastas organizada:
  ```
  src/
  ├── components/
  │   ├── auth/
  │   ├── admin/
  │   ├── teacher/
  │   ├── student/
  │   ├── shared/
  │   └── ui/
  ├── pages/
  │   ├── auth/
  │   ├── admin/
  │   ├── teacher/
  │   └── student/
  ├── lib/
  │   ├── supabase.ts
  │   ├── api/
  │   └── utils/
  ├── hooks/
  ├── types/
  └── contexts/
  ```

### Resumo da Fase 1:
**O que foi implementado:**
- Configuração completa do ambiente de desenvolvimento
- Estrutura de pastas profissional
- Integração básica com Supabase
- Configuração de ferramentas de desenvolvimento

**O que foi considerado para implementação:**
- Arquitetura escalável para multi-usuários (admin, professor, aluno)
- Padrões de desenvolvimento modernos com TypeScript
- Separação clara de responsabilidades por módulos

**O que foi aprendido com os erros nesta fase:**
- Importância de configurar corretamente as variáveis de ambiente
- Necessidade de estrutura bem definida desde o início

**Quais logs para identificar os erros nesta fase foram inseridos:**
- Logs de conexão com Supabase
- Validação de configurações de ambiente

---

## **FASE 2: SISTEMA DE AUTENTICAÇÃO**
**Status: ✅ CONCLUÍDA**

### Checklist de Implementação:
- **2.1** Tela de Login (/auth/login) com componentes:
  - Logo da escola
  - Formulário (email, senha, "esqueci minha senha", "lembrar-me")
  - Redirecionamento baseado em role (admin → /admin/dashboard, teacher → /teacher/dashboard, student → /student/dashboard)
- **2.2** Tela de Registro (/auth/register) com formulário em steps:
  - Step 1: Tipo de cadastro (Aluno/Professor)
  - Step 2: Dados básicos (nome, CPF, email, telefone, senha)
  - Step 3: Dados complementares para alunos (nascimento, endereço, contato emergência, info médicas)
- **2.3** Lógica pós-registro:
  - Aluno → Ativo imediatamente
  - Professor → Aguarda aprovação do admin

### Resumo da Fase 2:
**O que foi implementado:**
- Sistema completo de autenticação com Supabase Auth
- Auto-registro para estudantes com aprovação automática
- Fluxo de aprovação para professores
- Redirecionamento baseado em roles

**O que foi considerado para implementação:**
- Segurança: estudantes podem se registrar, mas admin controla aprovações
- UX: formulários em steps para melhor experiência
- Flexibilidade: diferentes fluxos para diferentes tipos de usuário

**O que foi aprendido com os erros nesta fase:**
- Importância da validação de dados no frontend e backend
- Necessidade de feedback claro para usuários em processo de aprovação

**Quais logs para identificar os erros nesta fase foram inseridos:**
- Logs de tentativas de login/registro
- Logs de erros de validação
- Logs de aprovação de usuários

---

## **FASE 3: PORTAL ADMINISTRATIVO**
**Status: ✅ CONCLUÍDA**

### Checklist de Implementação:
- **3.1** Dashboard Administrativo (/admin/dashboard):
  - Header (logo, nome usuário, logout, menu mobile)
  - Sidebar (dashboard, alunos, professores, turmas, financeiro, eventos, relatórios, configurações)
  - Cards resumo (alunos ativos, receita mensal, inadimplência, aulas hoje)
  - Gráficos (evolução matrículas, receita por modalidade, ocupação turmas)
  - Tabela últimos pagamentos, lista aniversariantes
- **3.2** Gestão de Professores (/admin/teachers):
  - Listagem (nome, especialidades, telefone, status, ações)
  - Busca e filtros
  - Formulário novo professor (dados, especialidades, comissão, dados bancários)
  - Visualização detalhada (turmas, comissões, histórico)
- **3.3** Gestão de Modalidades e Turmas:
  - Lista modalidades (/admin/class-types) com cores
  - Listagem turmas (/admin/classes) - grade visual + lista
  - Formulário nova turma (nome, modalidade, professor, horário, capacidade, valor)
- **3.4** Gestão de Alunos (/admin/students):
  - Listagem com busca e filtros
  - Visualização detalhada com 5 tabs (pessoais, matrículas, financeiro, presença, observações)
- **3.5** Sistema de Matrículas (modal):
  - Step 1: Seleção de turmas (múltipla, validação conflitos)
  - Step 2: Confirmação valores
  - Step 3: Forma de pagamento (PIX, boleto, cartão, dinheiro)
- **3.6** Sistema Financeiro (/admin/finance):
  - Tab mensalidades (filtros, ações em lote)
  - Tab pagamentos (conciliação automática)
  - Tab comissões (cálculo automático)
  - Tab relatórios (receita, inadimplência, fluxo caixa)
- **3.7** Integração Asaas completa:
  - Edge Functions para pagamentos
  - Webhook para confirmações automáticas
  - Sistema e-commerce completo

### Resumo da Fase 3:
**O que foi implementado:**
- Portal administrativo completo e profissional
- Sistema de gestão de professores e turmas
- Gestão completa de alunos com interface detalhada
- Sistema de matrículas em 3 steps
- Sistema financeiro integrado com Asaas
- E-commerce checkout system completo

**O que foi considerado para implementação:**
- Interface intuitiva para administradores não-técnicos
- Validações robustas para evitar conflitos de horário
- Integração segura com gateway de pagamento
- Automação máxima de processos financeiros

**O que foi aprendido com os erros nesta fase:**
- Complexidade da integração com gateways de pagamento
- Importância de webhooks para automação
- Necessidade de validações em múltiplas camadas

**Quais logs para identificar os erros nesta fase foram inseridos:**
- Logs de transações de pagamento
- Logs de webhooks Asaas
- Logs de criação/edição de turmas
- Logs de matrículas e cancelamentos

---

## **FASE 4: PORTAL DO ESTUDANTE**
**Status: 📋 EM PROGRESSO**

### Checklist de Implementação:
- **4.1** Dashboard do Aluno (/student/dashboard):
  - Header simplificado (logo, nome, menu)
  - Cards informativos (próxima aula, status pagamento, presenças)
  - Minhas turmas (cards com professor, horário, sala)
  - Avisos importantes da escola
  - Ações rápidas (pagar mensalidade, ver agenda)
- **4.2** Agenda do Aluno (/student/schedule):
  - Calendário mensal com aulas coloridas por modalidade
  - Detalhes ao clicar no dia
  - Legenda de cores e filtros por turma
- **4.3** Pagamentos do Aluno (/student/payments):
  - Tab pendentes (cards mensalidades, botão "pagar agora")
  - Tab histórico (filtros, download comprovantes)
  - Modal pagamento (PIX QR Code, boleto, cartão)
- **4.4** Matrícula Online (/student/enrollment):
  - Step 1: Escolher modalidades
  - Step 2: Escolher turmas (horários, vagas)
  - Step 3: Confirmar matrícula (resumo, termos)
  - Step 4: Pagamento primeira mensalidade

### Resumo da Fase 4:
**O que foi implementado:**
- [A ser preenchido após conclusão]

**O que foi considerado para implementação:**
- [A ser preenchido após conclusão]

**O que foi aprendido com os erros nesta fase:**
- [A ser preenchido após conclusão]

**Quais logs para identificar os erros nesta fase foram inseridos:**
- [A ser preenchido após conclusão]

---

## **FASE 5: PORTAL DO PROFESSOR**
**Status: ✅ CONCLUÍDA**

### Checklist de Implementação:
- **5.1** Dashboard do Professor (/teacher/dashboard):
  - Turmas hoje (cards horário, sala, qtd alunos, botão chamada)
  - Agenda semanal com todas as aulas
  - Resumo financeiro (comissões, total alunos, próximo pagamento)
- **5.2** Gestão de Turmas (/teacher/classes/[id]):
  - Lista alunos matriculados (nome, telefone, foto, status pagamento, % presença)
  - Sistema fazer chamada (checkbox, observações por aluno)
  - Anotações da aula (texto rico, upload arquivos, visível admin)
- **5.3** Relatórios do Professor (/teacher/reports):
  - Frequência por turma
  - Evolução dos alunos
  - Comissões detalhadas
  - Export para PDF

### Resumo da Fase 5:
**O que foi implementado:**
- Portal completo para professores
- Sistema de chamada e acompanhamento de alunos
- Relatórios detalhados de performance e comissões
- Interface intuitiva para gestão diária

**O que foi considerado para implementação:**
- Foco na praticidade do dia-a-dia do professor
- Informações financeiras transparentes
- Ferramentas de acompanhamento pedagógico

**O que foi aprendido com os erros nesta fase:**
- Necessidade de interface simples para uso durante as aulas
- Importância de relatórios claros para gestão de comissões

**Quais logs para identificar os erros nesta fase foram inseridos:**
- Logs de chamadas realizadas
- Logs de cálculo de comissões
- Logs de acesso a relatórios

---

## **FASE 6: SISTEMA DE EVENTOS**
**Status: ⏳ AGUARDANDO**

### Checklist de Implementação:
- **6.1** Gestão de Eventos Admin (/admin/events):
  - Lista eventos (nome, data, ingressos vendidos, status)
  - Formulário novo evento (nome, data, local, descrição, imagem, tipos ingresso)
- **6.2** Venda de Ingressos (/events/[id] - pública):
  - Banner evento, informações
  - Seletor ingressos, botão comprar
  - Integração pagamento
- **6.3** Check-in de Eventos (/admin/events/[id]/checkin):
  - Leitor QR Code
  - Busca nome/CPF
  - Lista presentes, estatísticas tempo real
- **6.4** Comanda Digital (/admin/events/[id]/bar):
  - Catálogo produtos
  - Carrinho, vincular CPF/ingresso
  - Fechar comanda, aceitar pagamento

### Resumo da Fase 6:
**O que foi implementado:**
- [A ser preenchido após conclusão]

**O que foi considerado para implementação:**
- [A ser preenchido após conclusão]

**O que foi aprendido com os erros nesta fase:**
- [A ser preenchido após conclusão]

**Quais logs para identificar os erros nesta fase foram inseridos:**
- [A ser preenchido após conclusão]