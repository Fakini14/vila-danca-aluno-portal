# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 PROJECT OVERVIEW

**Vila Dança & Arte - Student Portal System**

This is a comprehensive dance school management system with separate portals for administrators, teachers, and students. The system handles student enrollment, class management, payment processing, attendance tracking, and event management.

### Current Development Status
The project is in active development with the following modules already implemented:
- ✅ **Complete Authentication System** (Supabase Auth with self-service registration)
- ✅ **Complete Database Schema** with user roles, permissions, and auth_status tracking
- ✅ **Complete Teacher Portal System** (All 6 pages: Dashboard, Classes, Students, Schedule, Commissions, Reports)
- ✅ **Complete Admin Class Types Management** (Full CRUD with colors, filtering, status toggle)
- ✅ **Complete Admin Classes Management** (List view, filtering, modal form, dedicated new page)
- ✅ **Complete Admin Student Management** (Read-only list, detailed view with 5 tabs, enrollment system)
- ✅ **Complete Enrollment System** (3-step workflow: selection, confirmation, payment)
- ✅ **Secure Authentication Flow** (Students register themselves, admin only edits data)
- ✅ **Student Self-Enrollment System** (Complete RLS policies for student-initiated enrollments)
- ✅ **E-commerce Checkout System** (Full Asaas integration with PIX, Boleto, Credit Card)
- ✅ **Payment Webhook Automation** (Automatic enrollment activation after payment confirmation)

### Key Business Logic
- **Multi-role system**: Admin, Teacher (Professor), Student (Aluno)
- **Multiple enrollments**: Students can enroll in multiple classes simultaneously
- **Separate billing**: Each class enrollment generates independent monthly charges
- **Payment processing**: Integration with ASAAS payment gateway (PIX, Boleto, Credit Card)
- **Attendance tracking**: Teachers mark presence for commission calculations
- **Event management**: Separate module for school events and ticket sales

### Development Roadmap Reference
This project follows a detailed 28-day development plan divided into 6 phases:
1. **PHASE 0**: Initial setup (Days 1-3) ✅
2. **PHASE 1**: Login system (Days 4-5) ✅ 
3. **PHASE 2**: Admin portal (Days 6-15) ✅ **COMPLETED** - Class management, student management, secure auth
4. **PHASE 3**: Student portal (Days 16-20) 📋 *IN PROGRESS* - Dashboard and available classes view completed
5. **PHASE 4**: Teacher portal (Days 21-23) ✅ **COMPLETED AHEAD OF SCHEDULE**
6. **PHASE 5**: Event system (Days 24-28) - *Next after completing Student Portal*

**Current Priority**: Begin Phase 3 - Student Portal development as admin and teacher portals are complete.

### Recent Fixes - Student Self-Enrollment RLS Policies

**Date**: July 29, 2025
**Issue**: Students couldn't enroll themselves due to Row Level Security (RLS) policy restrictions.

**Root Cause**:
1. Missing student records for users with `aluno` role
2. RLS policies only allowed staff to INSERT enrollments - students couldn't create their own
3. RLS policies didn't allow students to INSERT payment records

**Solution Implemented**:
1. ✅ **Created missing student records** for all `aluno` users with `auth_status = 'active'`
2. ✅ **Added RLS policy**: "Students can create their own enrollments" - allows INSERT with `student_id = auth.uid()`
3. ✅ **Added RLS policy**: "Students can create their own payments" - allows INSERT with `student_id = auth.uid()`
4. ✅ **Created auto-trigger**: `trigger_auto_create_student` automatically creates student records for new `aluno` profiles
5. ✅ **Added helper function**: `ensure_student_record()` for manual student record creation

**Database Changes**:
```sql
-- New RLS Policies
CREATE POLICY "Students can create their own enrollments" ON enrollments FOR INSERT WITH CHECK (auth.uid() = student_id AND EXISTS (SELECT 1 FROM students WHERE id = auth.uid() AND auth_status = 'active'));

CREATE POLICY "Students can create their own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = student_id AND EXISTS (SELECT 1 FROM students WHERE id = auth.uid() AND auth_status = 'active'));

-- Auto-creation trigger for new student users
CREATE TRIGGER trigger_auto_create_student AFTER INSERT ON profiles FOR EACH ROW EXECUTE FUNCTION auto_create_student_record();
```

**Result**: Students can now successfully enroll themselves in classes and access the checkout system.

## Development Commands

### Core Development
- `npm run dev` - Start development server (Vite on http://localhost:5173)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Package Management
- `npm i` - Install dependencies
- Uses npm with package-lock.json

### Test Running
**Note**: No test framework is currently configured. When implementing tests, install a test runner like Vitest or Jest.

## Architecture Overview

This is a React-based dance school student portal built with modern web technologies:

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: shadcn/ui with Radix UI components
- **Styling**: Tailwind CSS + CSS variables for theming
- **Backend**: Supabase (PostgreSQL database + Auth + Edge Functions)
- **State Management**: TanStack Query for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Payment Gateway**: Asaas (PIX, Boleto, Credit Card)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: Sonner toast library

### Database Schema
The Supabase database includes these main entities:
- `profiles` - User base information (linked to Supabase auth)
- `students` - Student-specific data with auth_status tracking
- `staff` - Staff members (teachers, admin, etc.)
- `class_types` - Dance modalities (Ballet, Jazz, etc.) with colors
- `classes` - Dance classes with schedules, pricing, and teacher assignments
- `enrollments` - Student enrollments in classes with status tracking
- `payments` - Payment tracking with ASAAS integration
- `attendance` - Class attendance records for commission calculations
- `notes` - Administrative notes about students
- `announcements` - System announcements

### Key User Roles
- `aluno` (student) - Access to student portal
- `admin` - Full administrative access
- `professor` (teacher) - Class management
- `funcionario` (staff) - Limited admin functions

### Application Structure

#### Authentication Flow
- Uses Supabase Auth with custom `useAuth` hook (`src/hooks/useAuth.tsx`)
- Profile data fetched from `profiles` table after authentication
- Role-based routing with `ProtectedRoute` component
- Self-service registration for students, admin approval for teachers

#### Main Components
- `src/pages/Dashboard.tsx` - Main entry point, renders different dashboards based on user role
- `src/components/StudentPortal.tsx` - Student-specific interface with tabs
- `src/components/AdminDashboard.tsx` - Administrative interface with stats
- `src/layouts/AdminLayout.tsx` - Admin portal layout with sidebar
- `src/layouts/TeacherLayout.tsx` - Teacher portal layout

#### Component Organization
- `src/components/ui/` - shadcn/ui components (auto-generated, avoid manual editing)
- `src/components/admin/` - Admin-specific components (students/, charts/, tables/, forms/)
- `src/components/student/` - Student-specific components
- `src/components/teacher/` - Teacher-specific components
- `src/components/checkout/` - E-commerce checkout flow components
- `src/pages/` - Route-level components
- `src/hooks/` - Custom React hooks
- `src/integrations/supabase/` - Supabase client and type definitions

#### Database Integration
- Types auto-generated from Supabase schema in `src/integrations/supabase/types.ts`
- Client configuration in `src/integrations/supabase/client.ts`
- Uses TanStack Query for data fetching and caching

### Development Notes

#### Supabase Integration
- Database migrations stored in `supabase/migrations/`
- Edge functions in `supabase/functions/` for payment processing and email notifications
- RLS (Row Level Security) policies control data access
- MCP Server configured for Supabase (see `.mcp.json`)

#### UI Components
- All UI components use shadcn/ui patterns
- Consistent styling with Tailwind CSS
- Dark/light theme support via `next-themes`
- Form validation with Zod schemas

#### Payment Integration (**NEWLY IMPLEMENTED**)
- **Complete E-commerce Checkout**: Professional checkout flow with Asaas integration
- **Multiple Payment Methods**: PIX, Boleto, Credit Card support
- **Webhook Automation**: Automatic enrollment activation after payment confirmation
- **Edge Functions**: 
  - `create-enrollment-payment`: Handles payment creation and customer management
  - `asaas-webhook`: Processes payment confirmations and activates enrollments
  - `send-enrollment-confirmation`: Sends beautiful confirmation emails
- **Checkout Pages**: 
  - `/checkout/:paymentId`: Main checkout interface
  - `/checkout/success`: Payment confirmation page
  - `/checkout/failure`: Payment failure handling with retry options
- **Security**: Full encryption and secure payment processing through Asaas gateway

## 🎯 DEVELOPMENT GUIDELINES

When working with this codebase:
1. Always check user roles before rendering admin functionality
2. Use existing UI components from `src/components/ui/`
3. Follow the established pattern for forms using React Hook Form + Zod
4. Ensure proper error handling with toast notifications
5. Maintain Portuguese language for user-facing text
6. **Check the detailed roadmap below** to understand current development phase and next steps
7. **Update project status** in this file when completing major milestones
8. Run `npm run lint` before committing to ensure code quality
9. Use absolute imports with `@/` prefix (configured in tsconfig)
10. Follow existing file naming conventions (PascalCase for components, kebab-case for pages)

## 📅 DETAILED DEVELOPMENT ROADMAP

### Current Phase Status Tracker
Update this section when working on the project to track progress:

**Current Focus**: PHASE 3 - Student Portal (Days 16-20)
**Last Completed**: Day 12+ - E-commerce Checkout System Implementation
**Next Priority**: Complete Day 13-14 - Student Portal Development
**Major Achievement**: ✅ **BREAKTHROUGH**: Complete E-commerce checkout system with Asaas integration

### ✅ COMPLETED PHASES SUMMARY

**PHASE 2 - Admin Portal (Days 6-15)**: COMPLETED
- ✅ **Day 9**: Complete Class Types and Classes Management
  - ✅ Full CRUD system for dance modalities with color coding
  - ✅ Advanced class scheduling with conflict detection
  - ✅ Multi-teacher assignment and capacity management
  
- ✅ **Day 10-11**: Complete Student Management System
  - ✅ Advanced student list with statistics dashboard
  - ✅ 5-tab detailed view (Personal, Enrollments, Finance, Attendance, Notes)  
  - ✅ **SECURITY BREAKTHROUGH**: Removed admin password creation
  - ✅ **Self-service registration**: Students create their own accounts
  - ✅ **Read-only admin interface**: Admin only views/edits student data
  - ✅ Auth status tracking with automatic email confirmation triggers

- ✅ **Day 12**: Complete Enrollment System (3-Step Workflow)
  - ✅ **Step 1**: Class selection with conflict detection and capacity validation
  - ✅ **Step 2**: Enrollment data confirmation with summary and pricing
  - ✅ **Step 3**: Payment method selection (PIX, Boleto, Card, Cash)
  - ✅ **Advanced UX**: Step indicator, navigation controls, and validation
  - ✅ **Database Integration**: Enrollment and payment record creation

- ✅ **Day 12+**: E-commerce Checkout System Implementation (**MAJOR BREAKTHROUGH**)
  - ✅ **Phase 1**: EnrollmentModal reestructured with e-commerce checkout flow
  - ✅ **Phase 1**: CheckoutPage.tsx created with professional Asaas interface
  - ✅ **Phase 2**: create-enrollment-payment Edge Function for multiple classes
  - ✅ **Phase 2**: asaas-webhook Edge Function for automatic confirmations
  - ✅ **Phase 3**: CheckoutSuccess & CheckoutFailure pages with complete UX
  - ✅ **Phase 3**: App.tsx routes updated for /checkout/* endpoints
  - ✅ **Phase 3**: send-enrollment-confirmation Edge Function for emails
  - ✅ **Integration**: Full Asaas payment gateway with PIX, Boleto, and Credit Card
  - ✅ **Automation**: Webhook-driven enrollment activation after payment confirmation
  - ✅ **Security**: Professional checkout flow with encrypted payment processing

**PHASE 4 - Teacher Portal (Days 21-23)**: COMPLETED AHEAD OF SCHEDULE  
- ✅ Complete teacher dashboard with today's classes and stats
- ✅ Class management with enrollment data and attendance tracking
- ✅ Student view with payment status and presence history
- ✅ Weekly schedule calendar with class details
- ✅ Commission tracking with payment calculations
- ✅ Performance reports and analytics

### Full Implementation Plan - Vila Dança & Arte System

#### 🎯 System Architecture Overview
**User Structure and Permissions:**
1. ADMIN (Administrador)
   - Acesso total ao sistema
   - Gestão de alunos, professores, turmas, financeiro
   - Relatórios completos
   
2. TEACHER (Professor)
   - Visualiza suas turmas e alunos
   - Registra presença
   - Adiciona observações sobre aulas
   - Visualiza sua agenda e comissões
   
3. STUDENT (Aluno)
   - Acesso ao portal do aluno
   - Visualiza suas aulas e pagamentos
   - Realiza matrículas online
**Payment System:**
- Cada TURMA tem um valor mensal
- Aluno pode se matricular em MÚLTIPLAS turmas
- Cada matrícula gera uma cobrança mensal SEPARADA
- Pagamentos via Asaas (PIX, Boleto, Cartão)

#### 📋 EXACT DEVELOPMENT ORDER
FASE 0: Setup Inicial (3 dias)
Dia 1: Configuração Base
1. Criar projeto no Lovable
2. Instalar dependências:
   - @supabase/supabase-js
   - @tanstack/react-query
   - date-fns
   - react-hook-form
   - zod
   - lucide-react
   - sonner (para toasts)
   
3. Configurar Supabase:
   - Criar projeto
   - Anotar URL e ANON KEY
   
4. Estrutura de pastas:
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

   FASE 1: Sistema de Login (2 dias)
Dia 4: Tela de Login/Registro
TELA: /auth/login

Componentes:
1. Logo da escola
2. Formulário com:
   - Email
   - Senha
   - Botão "Esqueci minha senha"
   - Checkbox "Lembrar-me"
3. Botão de login
4. Link para "Primeira vez? Cadastre-se"
5. Após login, redirecionar baseado no role:
   - admin → /admin/dashboard
   - teacher → /teacher/dashboard
   - student → /student/dashboard
Dia 5: Tela de Registro
TELA: /auth/register

Formulário em steps:
Step 1: Tipo de cadastro
  - Sou aluno
  - Sou professor (requer aprovação admin)

Step 2: Dados básicos
  - Nome completo*
  - CPF*
  - Email*
  - Telefone*
  - Senha*

Step 3 (Se aluno): Dados complementares
  - Data de nascimento
  - Endereço
  - Contato de emergência
  - Telefone de emergência
  - Informações médicas

Após registro:
- Aluno → Ativo imediatamente
- Professor → Aguarda aprovação do admin

FASE 2: Portal do ADMINISTRADOR (10 dias)
⚠️ COMEÇAMOS PELO ADMIN PORQUE ELE PRECISA CADASTRAR TURMAS E PROFESSORES
Dia 6-7: Dashboard Administrativo
TELA: /admin/dashboard

Componentes:
1. Header com:
   - Logo
   - Nome do usuário
   - Botão de logout
   - Menu hamburguer (mobile)

2. Sidebar com menu:
   - Dashboard
   - Alunos
   - Professores
   - Turmas
   - Financeiro
   - Eventos
   - Relatórios
   - Configurações

3. Cards de resumo:
   - Total de alunos ativos
   - Receita do mês
   - Taxa de inadimplência
   - Aulas hoje

4. Gráficos:
   - Evolução de matrículas (linha)
   - Receita por modalidade (pizza)
   - Ocupação das turmas (barras)

5. Tabela de últimos pagamentos
6. Lista de aniversariantes do mês

Dia 8: Gestão de Professores
TELA: /admin/teachers

Listagem:
- Tabela com: Nome, Especialidades, Telefone, Status, Ações
- Busca por nome
- Filtro por modalidade
- Botão "Adicionar Professor"

TELA: /admin/teachers/new (ou modal)
Formulário:
- Buscar usuário por email (se já cadastrado)
- Nome completo*
- CPF*
- Telefone*
- Especialidades (multi-select de modalidades)
- Taxa de comissão (%)
- Dados bancários
- Chave PIX

TELA: /admin/teachers/[id]
- Visualizar dados completos
- Turmas que leciona
- Relatório de comissões
- Histórico de pagamentos

Dia 9: Gestão de Modalidades e Turmas
TELA: /admin/class-types
- Lista de modalidades (Ballet, Jazz, etc)
- Adicionar/Editar/Excluir modalidade
- Definir cor para cada modalidade

TELA: /admin/classes
Listagem:
- Grade semanal visual (tipo agenda)
- Vista em lista também disponível
- Filtros: Professor, Modalidade, Dia

TELA: /admin/classes/new
Formulário:
- Nome da turma*
- Modalidade*
- Professor*
- Dia da semana*
- Horário início/fim*
- Sala
- Capacidade máxima
- Valor mensal*
- Ativa (sim/não)
Dia 10-11: Gestão de Alunos
TELA: /admin/students

Listagem:
- Tabela: Nome, Telefone, Turmas, Status pagamento, Ações
- Busca por nome/CPF
- Filtros: Status (ativo/inativo), Inadimplente
- Botão "Adicionar Aluno"

TELA: /admin/students/[id]
Tabs:
1. Dados Pessoais
   - Todos os dados do aluno
   - Botão editar

2. Matrículas
   - Lista de turmas matriculadas
   - Status de cada matrícula
   - Botão "Matricular em nova turma"
   - Botão "Cancelar matrícula"

3. Financeiro
   - Lista de mensalidades
   - Status: Pago/Pendente/Vencido
   - Botão "Registrar pagamento manual"
   - Botão "Gerar cobrança"

4. Presença
   - Histórico de presença por turma
   - % de presença

5. Observações
   - Campo de texto para anotações
Dia 12: Sistema de Matrículas
MODAL: Matricular Aluno

Step 1: Selecionar turmas
- Lista de turmas disponíveis
- Checkbox para múltipla seleção
- Mostrar horário e valor de cada turma
- Validar conflito de horários

Step 2: Confirmar valores
- Resumo das turmas selecionadas
- Valor total mensal
- Data de início
- Gerar primeira mensalidade

Step 3: Forma de pagamento da matrícula
- PIX (gerar QR Code)
- Boleto
- Cartão
- Dinheiro (registro manual)
Dia 13-14: Sistema Financeiro
TELA: /admin/finance

Tabs:
1. Mensalidades
   - Filtros: Mês, Status, Turma
   - Lista de todas as mensalidades
   - Ações em lote: Gerar cobranças, Enviar lembretes
   
2. Pagamentos
   - Registro de pagamentos recebidos
   - Conciliação automática (webhook Asaas)
   - Pagamentos manuais

3. Comissões
   - Cálculo automático por professor
   - Baseado em alunos presentes
   - Gerar relatório mensal

4. Relatórios
   - Receita por período
   - Inadimplência
   - Fluxo de caixa
Dia 15: Integração Asaas
typescript// src/lib/api/asaas.ts

const ASAAS_API_KEY = import.meta.env.VITE_ASAAS_API_KEY
const ASAAS_URL = 'https://api.asaas.com/v3'

export async function createCustomer(data: {
  name: string
  cpfCnpj: string
  email: string
  phone: string
}) {
  const response = await fetch(`${ASAAS_URL}/customers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY
    },
    body: JSON.stringify(data)
  })
  
  return response.json()
}

export async function createPayment(data: {
  customer: string // ID do cliente no Asaas
  billingType: 'BOLETO' | 'PIX' | 'CREDIT_CARD'
  value: number
  dueDate: string
  description: string
}) {
  // Implementação...
}

// Webhook handler (Edge Function no Supabase)
export async function handleAsaasWebhook(event: any) {
  const { payment } = event
  
  if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
    // Atualizar payment no banco
    await supabase
      .from('payments')
      .update({
        status: 'paid',
        paid_date: payment.paymentDate,
        payment_method: payment.billingType
      })
      .eq('asaas_payment_id', payment.id)
  }
}

FASE 3: Portal do ALUNO (5 dias)
Dia 16: Dashboard do Aluno
TELA: /student/dashboard

Componentes:
1. Header simplificado
   - Logo
   - Nome do aluno
   - Menu

2. Cards informativos:
   - Próxima aula (dia, hora, sala)
   - Status de pagamento
   - Presenças este mês

3. Minhas Turmas:
   - Card para cada turma matriculada
   - Professor, horário, sala
   - Botão "Ver detalhes"

4. Avisos Importantes:
   - Lista de comunicados da escola
   - Destaque para urgentes

5. Ações rápidas:
   - Botão "Pagar mensalidade"
   - Botão "Ver agenda completa"
Dia 17: Agenda do Aluno
TELA: /student/schedule

- Calendário mensal
- Aulas marcadas com cor da modalidade
- Clicar no dia mostra detalhes
- Legenda de cores
- Filtrar por turma
Dia 18-19: Pagamentos do Aluno
TELA: /student/payments

Tabs:
1. Pendentes
   - Card para cada mensalidade pendente
   - Turma, valor, vencimento
   - Botão "Pagar agora" → Modal de pagamento
   
2. Histórico
   - Lista de pagamentos realizados
   - Filtro por período
   - Download de comprovantes

MODAL: Pagamento
- Resumo do pagamento
- Opções:
  - PIX: Gerar QR Code + Copia e Cola
  - Boleto: Gerar e mostrar link
  - Cartão: Formulário seguro
Dia 20: Matrícula Online
TELA: /student/enrollment

Step 1: Escolher modalidades
- Cards com modalidades disponíveis
- Descrição e valores

Step 2: Escolher turmas
- Filtrar por modalidade selecionada
- Mostrar horários disponíveis
- Indicar vagas restantes

Step 3: Confirmar matrícula
- Resumo das escolhas
- Valor total mensal
- Aceite de termos

Step 4: Pagamento da primeira mensalidade

FASE 4: Portal do PROFESSOR (3 dias)
Dia 21: Dashboard do Professor
TELA: /teacher/dashboard

1. Minhas turmas hoje:
   - Cards com horário e sala
   - Quantidade de alunos
   - Botão "Fazer chamada"

2. Agenda semanal:
   - Grade com todas as aulas

3. Resumo financeiro:
   - Comissões do mês
   - Total de alunos
   - Próximo pagamento
Dia 22: Gestão de Turmas (Professor)
TELA: /teacher/classes/[id]

1. Lista de alunos matriculados:
   - Nome, telefone, foto
   - Status de pagamento
   - % de presença

2. Fazer chamada:
   - Lista com checkbox
   - Campo observação por aluno
   - Salvar presença

3. Anotações da aula:
   - Campo de texto rico
   - Upload de arquivos/vídeos
   - Visível para admin
Dia 23: Relatórios do Professor
TELA: /teacher/reports

- Frequência por turma
- Evolução dos alunos
- Suas comissões detalhadas
- Export para PDF

FASE 5: Sistema de EVENTOS (5 dias)
Dia 24-25: Gestão de Eventos (Admin)
TELA: /admin/events

Lista de eventos:
- Nome, data, ingressos vendidos
- Status: Planejado/Vendendo/Realizado

TELA: /admin/events/new
- Nome do evento*
- Data e horário*
- Local
- Descrição
- Imagem de capa
- Tipos de ingresso:
  - Nome (Pista, VIP, etc)
  - Valor
  - Quantidade disponível
Dia 26: Venda de Ingressos
TELA: /events/[id] (pública)

- Banner do evento
- Informações
- Seletor de ingressos
- Botão comprar
- Integração pagamento
Dia 27: Check-in de Eventos
TELA: /admin/events/[id]/checkin

- Leitor de QR Code
- Busca por nome/CPF
- Lista de presentes
- Estatísticas em tempo real
Dia 28: Comanda Digital
TELA: /admin/events/[id]/bar

- Catálogo de produtos
- Carrinho
- Vincular ao CPF/ingresso
- Fechar comanda
- Aceitar pagamento

#### 🔧 DETAILED TECHNICAL CONFIGURATIONS

**Environment Variables (.env.local):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ASAAS_API_KEY=your_asaas_api_key
VITE_ASAAS_WEBHOOK_TOKEN=your_webhook_token
```

**Important**: The project uses Vite, so all client-side environment variables must be prefixed with `VITE_`
**Route Structure:**
typescript// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

// Páginas de Auth
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'

// Páginas Admin
import AdminLayout from '@/layouts/AdminLayout'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminStudents from '@/pages/admin/Students'
// ... outras páginas admin

// Páginas Student
import StudentLayout from '@/layouts/StudentLayout'
import StudentDashboard from '@/pages/student/Dashboard'
// ... outras páginas student

// Páginas Teacher
import TeacherLayout from '@/layouts/TeacherLayout'
import TeacherDashboard from '@/pages/teacher/Dashboard'
// ... outras páginas teacher

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          
          {/* Rotas Admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            {/* ... outras rotas admin */}
          </Route>
          
          {/* Rotas Student */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/student/dashboard" />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            {/* ... outras rotas student */}
          </Route>
          
          {/* Rotas Teacher */}
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/teacher/dashboard" />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            {/* ... outras rotas teacher */}
          </Route>
          
          {/* Rota padrão */}
          <Route path="/" element={<Navigate to="/auth/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
**Route Protection Component:**
typescript// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

type Props = {
  children: React.ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { profile, loading } = useAuth()
  
  if (loading) {
    return <div>Carregando...</div>
  }
  
  if (!profile) {
    return <Navigate to="/auth/login" />
  }
  
  if (!allowedRoles.includes(profile.role)) {
    return <Navigate to="/unauthorized" />
  }
  
  return <>{children}</>
}

#### 🔌 Supabase Edge Functions

The project includes several Edge Functions for payment and notification handling:

1. **create-enrollment-payment** - Creates Asaas payment for student enrollments
   - Handles multiple class enrollments in a single payment
   - Creates or updates Asaas customer records
   - Generates payment links for PIX, Boleto, or Credit Card

2. **asaas-webhook** - Processes Asaas payment webhooks
   - Validates webhook authenticity
   - Updates payment status in database
   - Activates enrollments upon payment confirmation

3. **send-enrollment-confirmation** - Sends confirmation emails
   - Beautiful HTML email templates
   - Includes enrollment details and payment information

4. **send-staff-invitation** / **resend-staff-invitation** - Staff onboarding emails
   - Sends invitation to new staff members
   - Handles invitation resending

**Edge Function Deployment**:
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

## 🛠️ Common Development Tasks

### Adding a New Feature
1. Check the current development phase in the roadmap
2. Create components in the appropriate directory (`admin/`, `student/`, `teacher/`)
3. Use existing UI components and patterns
4. Add proper TypeScript types
5. Implement proper error handling with toast notifications
6. Update CLAUDE.md with the completed feature

### Working with Forms
```typescript
// Example form pattern used throughout the project
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
});
```

### Database Queries with TanStack Query
```typescript
// Pattern for data fetching
const { data, isLoading, error } = useQuery({
  queryKey: ['students'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },
});
```

### Adding New Routes
1. Add route in `src/App.tsx`
2. Wrap with `ProtectedRoute` if authentication required
3. Use appropriate layout component (`AdminLayout`, `TeacherLayout`)
4. Follow existing URL patterns (`/admin/*`, `/student/*`, `/teacher/*`)

## 📝 Project-Specific Patterns

### Authentication Check Pattern
```typescript
const { profile } = useAuth();
if (profile?.role !== 'admin') {
  return <Navigate to="/unauthorized" />;
}
```

### Toast Notifications Pattern
```typescript
import { toast } from "sonner";

// Success
toast.success("Turma criada com sucesso!");

// Error
toast.error("Erro ao criar turma");
```

### Date Formatting Pattern
```typescript
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
```

## 🚨 Important Reminders
- **NEVER** expose API keys in client-side code
- **ALWAYS** use RLS policies for data security
- **MAINTAIN** Portuguese language for all user-facing text
- **FOLLOW** the existing code style and patterns
- **UPDATE** this file when completing major features
- **TEST** enrollment flows thoroughly as they involve payments