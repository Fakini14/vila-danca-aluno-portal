import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, GraduationCap, Calendar, UserPlus } from 'lucide-react';
import { ClassManager } from '@/components/ClassManager';
import { StudentManager } from '@/components/StudentManager';
import { EnrollmentManager } from '@/components/EnrollmentManager';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const canManageUsers = profile?.role === 'admin' || profile?.role === 'funcionario';
  const canManageClasses = profile?.role === 'admin' || profile?.role === 'funcionario';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            Sistema de gestão - Espaço Vila Dança & Arte
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {profile?.role === 'admin' ? 'Administrador' : 
           profile?.role === 'funcionario' ? 'Funcionário' : 'Professor'}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="students" disabled={!canManageUsers}>Alunos</TabsTrigger>
          <TabsTrigger value="classes" disabled={!canManageClasses}>Turmas</TabsTrigger>
          <TabsTrigger value="enrollments" disabled={!canManageUsers}>Matrículas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="dance-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Alunos ativos no sistema
                </p>
              </CardContent>
            </Card>

            <Card className="dance-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
                <GraduationCap className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Turmas em andamento
                </p>
              </CardContent>
            </Card>

            <Card className="dance-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matrículas do Mês</CardTitle>
                <UserPlus className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Novas matrículas este mês
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="dance-shadow">
            <CardHeader>
              <CardTitle>Bem-vindo ao Sistema</CardTitle>
              <CardDescription>
                Use as abas acima para navegar pelas diferentes funcionalidades do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Funcionalidades Disponíveis:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Gestão de alunos e suas informações</li>
                  <li>Criação e gerenciamento de turmas</li>
                  <li>Controle de matrículas</li>
                  <li>Relatórios e dashboard</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <StudentManager />
        </TabsContent>

        <TabsContent value="classes">
          <ClassManager />
        </TabsContent>

        <TabsContent value="enrollments">
          <EnrollmentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}