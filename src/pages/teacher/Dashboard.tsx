import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Calendar, 
  DollarSign,
  BookOpen,
  Clock,
  TrendingUp
} from 'lucide-react';

export default function TeacherDashboard() {

  return (
    <div className="space-y-6">

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

      </div>

    </div>
  );
}