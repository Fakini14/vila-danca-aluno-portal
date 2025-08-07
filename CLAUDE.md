# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## =� PROJECT OVERVIEW

**Vila Dan�a & Arte - Student Portal System**

This is a comprehensive dance school management system with separate portals for administrators, teachers, and students. The system handles student enrollment, class management, payment processing, attendance tracking, and event management.

### Current Development Status
The project is in active development with the following modules already implemented:
- **Complete Authentication System** (Supabase Auth with self-service registration)
- **Complete Database Schema** with user roles, permissions, and auth_status tracking  
- **Complete Teacher Portal System** (All 6 pages: Dashboard, Classes, Students, Schedule, Commissions, Reports)
- **Complete Admin Class Types Management** (Full CRUD with colors, filtering, status toggle)
- **Complete Admin Classes Management** (List view, filtering, modal form, dedicated new page)
- **Complete Admin Student Management** (Read-only list, detailed view with 5 tabs, enrollment system)
- **Complete Enrollment System** (3-step workflow: selection, confirmation, payment)
- **Secure Authentication Flow** (Students register themselves, admin only edits data)
- **Student Self-Enrollment System** (Complete RLS policies for student-initiated enrollments)
- **E-commerce Checkout System** (Full Asaas integration with PIX, Boleto, Credit Card)
- **Payment Webhook Automation** (Automatic enrollment activation after payment confirmation)
- **Email Confirmation System** (Auth confirmation with redirect handling)

### Key Business Logic
- **Multi-role system**: Admin, Teacher (Professor), Student (Aluno)
- **Multiple enrollments**: Students can enroll in multiple classes simultaneously
- **Separate billing**: Each class enrollment generates independent monthly charges
- **Payment processing**: Integration with ASAAS payment gateway (PIX, Boleto, Credit Card)
- **Attendance tracking**: Teachers mark presence for commission calculations
- **Event management**: Separate module for school events and ticket sales

## Development Commands

### Core Development
- `npm run dev` - Start development server (Vite on http://localhost:8080)
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Package Management
- `npm i` - Install dependencies
- Uses npm with package-lock.json

### Supabase Development
- `supabase functions deploy` - Deploy all Edge Functions
- `supabase functions deploy function-name` - Deploy specific function
- `supabase migration new migration-name` - Create new migration
- MCP Server configured for Supabase operations (see `.mcp.json`)

### Type Checking & Testing
- TypeScript checking is automatically enforced via hooks (see `.claude/hooks/tsc.js`)
- **Note**: No test framework is currently configured. When implementing tests, install a test runner like Vitest or Jest.

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
- **Build Tool**: Vite with SWC for React

### Database Schema
The Supabase database includes these main entities:
- `profiles` - User base information (linked to Supabase auth)
- `students` - Student-specific data with auth_status tracking
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
- `funcionario` - Administrative functions

### Application Structure

#### Authentication Flow
- Uses Supabase Auth with custom `useAuth` hook (`src/hooks/useAuth.tsx`)
- Profile data fetched from `profiles` table after authentication
- Role-based routing with `ProtectedRoute` component
- Self-service registration for students, admin approval for teachers

#### Route Structure
- **Public Routes**: `/`, `/auth`, `/auth/confirm`, `/reset-password`
- **Checkout Routes**: `/checkout/:paymentId`, `/checkout/success`, `/checkout/failure`
- **Admin Routes**: `/admin/*` - Protected for `admin` and `funcionario` roles
- **Teacher Routes**: `/teacher/*` - Protected for `professor` role
- **Student Routes**: `/student/*` - Protected for `aluno` role (basic portal implemented)

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

#### Payment Integration (**IMPLEMENTED**)
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

## <� DEVELOPMENT GUIDELINES

When working with this codebase:
1. Always check user roles before rendering admin functionality
2. Use existing UI components from `src/components/ui/`
3. Follow the established pattern for forms using React Hook Form + Zod
4. Ensure proper error handling with toast notifications
5. Maintain Portuguese language for user-facing text
6. Run `npm run lint` before committing to ensure code quality
7. Use absolute imports with `@/` prefix (configured in tsconfig and Vite)
8. Follow existing file naming conventions (PascalCase for components, kebab-case for pages)
9. Server runs on port 8080 (configured in vite.config.ts)

## =� Common Development Tasks

### Adding a New Feature
1. Create components in the appropriate directory (`admin/`, `student/`, `teacher/`)
2. Use existing UI components and patterns
3. Add proper TypeScript types
4. Implement proper error handling with toast notifications
5. Update CLAUDE.md with the completed feature

### Working with Forms
```typescript
// Example form pattern used throughout the project
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Nome � obrigat�rio"),
  email: z.string().email("Email inv�lido"),
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

## =� Project-Specific Patterns

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

## =� Important Reminders
- **NEVER** expose API keys in client-side code
- **ALWAYS** use RLS policies for data security
- **MAINTAIN** Portuguese language for all user-facing text
- **FOLLOW** the existing code style and patterns
- **UPDATE** this file when completing major features
- **TEST** enrollment flows thoroughly as they involve payments
- MCP Server is configured for Supabase integration - use MCP tools when available
- To check the current development phase, open docs/CLAUDE-ROADMAP.md file.

## 🚨 CRITICAL BUG ALERT - AUTH INFINITE LOADING

### ⚠️ Known Issue: Infinite Loading After Login

This is a **RECURRENT** bug that has been fixed multiple times. If you encounter infinite loading after login:

**🔍 Quick Debugging Steps:**
1. Open browser console and look for auth-related errors
2. Check Network tab for hanging Supabase requests to `profiles` table
3. Look for timeout messages in console logs
4. Verify `fetchUserProfile` is completing successfully

**🛠️ Root Cause:**
The `useAuth` hook's `fetchUserProfile` function can hang or fail silently, preventing `setLoading(false)` from being called.

**💡 Current Protections in `src/hooks/useAuth.tsx`:**
- ✅ `fetchUserProfile` timeout (10 seconds)
- ✅ `initializeAuth` timeout (5 seconds) 
- ✅ Auth fallback timeout (15 seconds)
- ✅ Enhanced error handling with Promise.race()

**🚨 DO NOT REMOVE** these timeout protections or the bug will return.

**🎯 If Bug Returns:**
1. Check if timeout protections were accidentally removed
2. Verify Supabase connection is stable
3. Check RLS policies on `profiles` table
4. Review recent changes to auth flow

**Important** The docs/CLAUDE-ROADMAP.md file must be updated by the implementation-documenter agent whenever any of the following occurs:
- A project milestone is completed
- Existing functionalities in the codebase are modified
- The system architecture or underlying technologies are changed
- New features or components are added

## 📚 Technical Documentation

For detailed technical information, refer to the specialized documentation in the `docs/` folder:

- **[docs/CLAUDE-ROADMAP.md](docs/CLAUDE-ROADMAP.md)** - **MAIN PROJECT ROADMAP** (8/9 phases completed)
  - Complete development history with detailed phase breakdowns
  - Links to all related technical documentation
  - Project status and metrics

- **[docs/auth.md](docs/auth.md)** - Complete authentication system documentation
  - JWT asymmetric architecture (Phase 8)
  - Performance optimizations and caching
  - Security configurations and troubleshooting

- **[docs/ASAAS-SUBSCRIPTION-PLAN.md](docs/ASAAS-SUBSCRIPTION-PLAN.md)** - Payment system integration
  - Recurring subscription architecture (Phase 6)
  - Edge functions and webhook automation
  - Checkout flow and payment methods

- **[docs/PERFORMANCE-OPTIMIZATIONS.md](docs/PERFORMANCE-OPTIMIZATIONS.md)** - Performance improvements
  - 70-90% performance gains achieved in Phase 3
  - Database optimizations and materialized views
  - Frontend caching strategies

- **[docs/MIGRATIONS_TO_RUN.md](docs/MIGRATIONS_TO_RUN.md)** - Database migrations
  - SQL scripts for Supabase execution
  - Step-by-step migration instructions
  - Post-migration verifications