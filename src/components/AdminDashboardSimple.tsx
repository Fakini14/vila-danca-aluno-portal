import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, DollarSign, BookOpen, Calendar, BarChart3, ArrowRight } from 'lucide-react';

export function AdminDashboardSimple() {
  const { profile } = useAuth();
  const navigate = useNavigate();

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

      {/* Cards de Resumo Simplificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Carregando dados...
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Carregando dados...
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Inadimplência</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Carregando dados...
            </p>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Hoje</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Carregando dados...
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

      {/* Cards informativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dance-shadow">
          <CardHeader>
            <CardTitle>Como Navegar</CardTitle>
            <CardDescription>
              Use o menu lateral ou os cards de ação rápida acima para navegar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Três formas de navegar:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong>Ações Rápidas:</strong> Cards clicáveis acima</li>
                <li><strong>Menu Lateral:</strong> Barra fixa à esquerda (desktop)</li>
                <li><strong>Menu Mobile:</strong> Botão ☰ no canto superior esquerdo</li>
                <li><strong>Breadcrumbs:</strong> Navegação contextual no topo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="dance-shadow">
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
            <CardDescription>
              Dashboard simplificado para debug de problemas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Versão Debug Ativa:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Gráficos temporariamente desabilitados</li>
                <li>Queries complexas removidas</li>
                <li>Error boundary ativo</li>
                <li>Sistema funcionando em modo simples</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}