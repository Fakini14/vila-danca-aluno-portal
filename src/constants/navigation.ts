import { Users, GraduationCap, DollarSign, BookOpen, Calendar } from 'lucide-react';

export const ADMIN_QUICK_ACTIONS = [
  { 
    icon: Users, 
    title: 'Gerenciar Alunos', 
    description: 'Visualizar e gerenciar informações dos alunos',
    path: '/admin/students',
    color: 'text-blue-500'
  },
  { 
    icon: GraduationCap, 
    title: 'Gerenciar Professores', 
    description: 'Administrar equipe de professores',
    path: '/admin/teachers',
    color: 'text-green-500'
  },
  { 
    icon: BookOpen, 
    title: 'Gerenciar Turmas', 
    description: 'Criar e organizar turmas e horários',
    path: '/admin/classes',
    color: 'text-purple-500'
  },
  { 
    icon: DollarSign, 
    title: 'Sistema Financeiro', 
    description: 'Controlar pagamentos e mensalidades',
    path: '/admin/finance',
    color: 'text-green-600'
  },
  { 
    icon: Calendar, 
    title: 'Eventos', 
    description: 'Organizar eventos e apresentações',
    path: '/admin/events',
    color: 'text-orange-500'
  }
];

export const TEACHER_MENU_ITEMS = [
  {
    title: 'Dashboard',
    path: '/teacher/dashboard',
    description: 'Visão geral do seu trabalho'
  },
  {
    title: 'Minhas Turmas',
    path: '/teacher/classes',
    description: 'Gerenciar turmas e alunos'
  },
  {
    title: 'Estudantes',
    path: '/teacher/students',
    description: 'Lista de todos os estudantes'
  }
];

export const STUDENT_MENU_ITEMS = [
  {
    title: 'Dashboard',
    path: '/student/dashboard',
    description: 'Visão geral das suas atividades'
  },
  {
    title: 'Minhas Turmas',
    path: '/student/classes',
    description: 'Turmas em que está matriculado'
  },
  {
    title: 'Agenda',
    path: '/student/schedule',
    description: 'Cronograma de aulas'
  },
  {
    title: 'Pagamentos',
    path: '/student/payments',
    description: 'Histórico e pendências'
  },
  {
    title: 'Matrícula',
    path: '/student/enrollment',
    description: 'Matricular-se em novas turmas'
  }
];

export const ADMIN_SIDEBAR_ITEMS = [
  { title: 'Dashboard', path: '/admin/dashboard' },
  { title: 'Alunos', path: '/admin/students' },
  { title: 'Professores', path: '/admin/teachers' },
  { title: 'Turmas', path: '/admin/classes' },
  { title: 'Modalidades', path: '/admin/class-types' },
  { title: 'Financeiro', path: '/admin/finance' },
  { title: 'Eventos', path: '/admin/events' }
];