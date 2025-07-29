import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  DollarSign,
  BookOpen,
  Clock,
  TrendingUp,
  Star
} from 'lucide-react';

export default function TeacherDashboard() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header de Boas-vindas */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold dance-text-gradient">
          Bem-vindo, {profile?.nome_completo?.split(' ')[0]}! 👨‍🏫
        </h1>
        <p className="text-muted-foreground">
          Aqui está um resumo das suas atividades na Vila Dança & Arte
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Turmas Ativas
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              turmas sob sua responsabilidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Alunos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              alunos matriculados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aulas Esta Semana
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              aulas programadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Comissões do Mês
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">
              baseado na presença
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Aulas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Aulas
            </CardTitle>
            <CardDescription>
              Suas aulas programadas para hoje e amanhã
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma aula programada</p>
                  <p className="text-xs">Configure suas turmas no menu lateral</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Status do Perfil
            </CardTitle>
            <CardDescription>
              Complete seu perfil para melhor experiência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Informações Básicas</span>
              <Badge variant="default" className="bg-green-500">Completo</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Especialidades</span>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Dados Bancários</span>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Taxa de Comissão</span>
              <Badge variant="secondary">Pendente</Badge>
            </div>
            <Button variant="outline" className="w-full mt-4">
              Completar Perfil
            </Button>
          </CardContent>
        </Card>

        {/* Resumo de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance do Mês
            </CardTitle>
            <CardDescription>
              Estatísticas das suas aulas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Taxa de Presença</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Aulas Ministradas</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Horas de Ensino</span>
                <span className="font-medium">0h</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-4">
                <div className="bg-primary h-2 rounded-full" style={{width: '0%'}}></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Comece a ministrar aulas para ver suas estatísticas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às funcionalidades principais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Ver Agenda Completa
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookOpen className="mr-2 h-4 w-4" />
              Gerenciar Turmas
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Lista de Alunos
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="mr-2 h-4 w-4" />
              Relatório de Comissões
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mensagem de Boas-vindas */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 rounded-full bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                Bem-vindo ao Portal do Professor! 🎉
              </h3>
              <p className="text-muted-foreground mb-4">
                Este é seu espaço para gerenciar turmas, acompanhar alunos, registrar presenças e visualizar suas comissões. 
                Para começar, complete seu perfil e aguarde a atribuição de turmas pelo administrador.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  Portal em Desenvolvimento
                </Badge>
                <Badge variant="outline">
                  Fase 2 - Day 21-23
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}