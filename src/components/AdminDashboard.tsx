import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, DollarSign, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { ADMIN_QUICK_ACTIONS } from '@/constants/navigation';
import { EnrollmentTrendChart } from '@/components/admin/charts/EnrollmentTrendChart';
import { RevenueByModalityChart } from '@/components/admin/charts/RevenueByModalityChart';
import { ClassOccupancyChart } from '@/components/admin/charts/ClassOccupancyChart';
import { RecentPaymentsTable } from '@/components/admin/tables/RecentPaymentsTable';
import { BirthdaysTable } from '@/components/admin/tables/BirthdaysTable';

interface AdminDashboardProps {
  mode?: 'full' | 'simple';
}

export function AdminDashboard({ mode = 'full' }: AdminDashboardProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const shouldFetchStats = mode === 'full';
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  
  // Override stats data for simple mode
  const actualStats = shouldFetchStats ? stats : null;
  const actualLoading = shouldFetchStats ? statsLoading : false;
  const actualError = shouldFetchStats ? statsError : null;

  const quickActions = ADMIN_QUICK_ACTIONS;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient mb-2">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vindo de volta, {profile?.nome_completo || 'Administrador'}
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {profile?.role === 'admin' ? 'Administrador' : 
           profile?.role === 'funcionario' ? 'Funcionário' : 'Professor'}
        </Badge>
      </div>

      {/* Error Card - Only for full mode */}
      {mode === 'full' && actualError && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro de Dados</CardTitle>
            <CardDescription className="text-red-600">
              Erro ao carregar estatísticas: {actualError?.message || 'Erro desconhecido'}
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
              {mode === 'simple' ? '--' : (
                actualLoading ? (
                  <div className="animate-pulse h-8 bg-muted rounded w-16"></div>
                ) : (
                  actualStats?.totalActiveStudents || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'simple' ? 'Carregando dados...' : (
                actualLoading ? 'Carregando...' : 'Alunos com matrículas ativas'
              )}
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
              {mode === 'simple' ? '--' : (
                actualLoading ? (
                  <div className="animate-pulse h-8 bg-muted rounded w-24"></div>
                ) : (
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                  }).format(actualStats?.monthRevenue || 0)
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'simple' ? 'Carregando dados...' : (
                actualLoading ? 'Carregando...' : 'Pagamentos recebidos este mês'
              )}
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
              {mode === 'simple' ? '--' : (
                actualLoading ? (
                  <div className="animate-pulse h-8 bg-muted rounded w-16"></div>
                ) : (
                  `${(actualStats?.defaultRate || 0).toFixed(1)}%`
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'simple' ? 'Carregando dados...' : (
                actualLoading ? 'Carregando...' : 'Pagamentos em atraso'
              )}
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
              {mode === 'simple' ? '--' : (
                actualLoading ? (
                  <div className="animate-pulse h-8 bg-muted rounded w-12"></div>
                ) : (
                  actualStats?.classesToday || 0
                )
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'simple' ? 'Carregando dados...' : (
                actualLoading ? 'Carregando...' : 'Turmas programadas para hoje'
              )}
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

      {/* Gráficos - Only for full mode */}
      {mode === 'full' && (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Relatórios e Análises</h2>
              <p className="text-sm text-muted-foreground">
                Dados em tempo real do sistema
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnrollmentTrendChart />
              <RevenueByModalityChart />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <ClassOccupancyChart />
            </div>
          </div>

          {/* Tabelas de Dados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Informações Recentes</h2>
              <p className="text-sm text-muted-foreground">
                Dados e atividades mais recentes
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentPaymentsTable />
              <BirthdaysTable />
            </div>
          </div>
        </>
      )}

      {/* Info Cards - Only for simple mode */}
      {mode === 'simple' && (
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
      )}
    </div>
  );
}