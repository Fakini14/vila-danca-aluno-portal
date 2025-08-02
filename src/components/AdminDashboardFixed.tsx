import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, DollarSign, AlertTriangle, BookOpen, Calendar, BarChart3, ArrowRight } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';

export function AdminDashboardFixed() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();

  console.log('🎯 AdminDashboard render - stats:', stats, 'loading:', statsLoading, 'error:', statsError);

  const quickActions = [
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
    },
    { 
      icon: BarChart3, 
      title: 'Relatórios', 
      description: 'Visualizar estatísticas e relatórios',
      path: '/admin/reports',
      color: 'text-indigo-500'
    }
  ];

  if (statsError) {
    console.error('❌ Erro nas estatísticas:', statsError);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {profile?.nome_completo || 'Administrador'}
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {profile?.role === 'admin' ? 'Administrador' : 
           profile?.role === 'funcionario' ? 'Funcionário' : 'Professor'}
        </Badge>
      </div>

      {/* Debug Card */}
      {statsError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro de Dados</CardTitle>
            <CardDescription className="text-red-600">
              Erro ao carregar estatísticas: {statsError?.message || 'Erro desconhecido'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 bg-muted rounded w-16"></div>
              ) : (
                stats?.totalActiveStudents || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? 'Carregando...' : 'Alunos com matrículas ativas'}
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 bg-muted rounded w-24"></div>
              ) : (
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                }).format(stats?.monthRevenue || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? 'Carregando...' : 'Pagamentos recebidos este mês'}
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 bg-muted rounded w-16"></div>
              ) : (
                `${(stats?.defaultRate || 0).toFixed(1)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? 'Carregando...' : 'Pagamentos em atraso'}
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <div className="animate-pulse h-8 bg-muted rounded w-12"></div>
              ) : (
                stats?.classesToday || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? 'Carregando...' : 'Turmas programadas para hoje'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Ações Rápidas</h2>
          <p className="text-sm text-muted-foreground">
            Clique em qualquer opção para acessar diretamente
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.path} 
                className="dance-shadow hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-primary/20 hover:border-l-primary"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${action.color}`} />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{action.description}</CardDescription>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3 w-full justify-start px-0 h-auto p-0 hover:bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(action.path);
                    }}
                  >
                    Acessar agora
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}