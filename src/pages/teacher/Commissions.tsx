import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Users,
  BookOpen,
  Eye,
  Download,
  Filter,
  Calculator,
  Banknote,
  CreditCard,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommissionData {
  month: string;
  year: number;
  classes: {
    id: string;
    name: string;
    modality: string;
    total_classes: number;
    attended_classes: number;
    commission_rate: number;
    value_per_class: number;
    gross_commission: number;
    net_commission: number;
    students: number;
  }[];
  totals: {
    total_classes: number;
    attended_classes: number;
    gross_commission: number;
    net_commission: number;
    attendance_rate: number;
  };
  payment_status: 'pending' | 'paid' | 'processing';
  payment_date?: string;
}

const useTeacherCommissions = (teacherId: string, selectedMonth: string) => {
  return useQuery({
    queryKey: ['teacher-commissions', teacherId, selectedMonth],
    queryFn: async (): Promise<CommissionData[]> => {
      // Por enquanto, vamos simular dados já que o sistema de presença ainda não foi implementado
      const mockData: CommissionData[] = [
        {
          month: 'julho',
          year: 2025,
          classes: [
            {
              id: '1',
              name: 'Ballet Clássico Iniciante',
              modality: 'Ballet',
              total_classes: 16,
              attended_classes: 14,
              commission_rate: 15.0,
              value_per_class: 45.00,
              gross_commission: 630.00,
              net_commission: 567.00,
              students: 12
            },
            {
              id: '2',
              name: 'Jazz Intermediário',
              modality: 'Jazz',
              total_classes: 12,
              attended_classes: 11,
              commission_rate: 15.0,
              value_per_class: 50.00,
              gross_commission: 550.00,
              net_commission: 495.00,
              students: 8
            }
          ],
          totals: {
            total_classes: 28,
            attended_classes: 25,
            gross_commission: 1180.00,
            net_commission: 1062.00,
            attendance_rate: 89.3
          },
          payment_status: 'paid',
          payment_date: '2025-08-05'
        },
        {
          month: 'junho',
          year: 2025,
          classes: [
            {
              id: '1',
              name: 'Ballet Clássico Iniciante',
              modality: 'Ballet',
              total_classes: 16,
              attended_classes: 15,
              commission_rate: 15.0,
              value_per_class: 45.00,
              gross_commission: 675.00,
              net_commission: 607.50,
              students: 12
            },
            {
              id: '2',
              name: 'Jazz Intermediário',
              modality: 'Jazz',
              total_classes: 14,
              attended_classes: 13,
              commission_rate: 15.0,
              value_per_class: 50.00,
              gross_commission: 650.00,
              net_commission: 585.00,
              students: 8
            }
          ],
          totals: {
            total_classes: 30,
            attended_classes: 28,
            gross_commission: 1325.00,
            net_commission: 1192.50,
            attendance_rate: 93.3
          },
          payment_status: 'paid',
          payment_date: '2025-07-05'
        }
      ];

      // Filtrar por mês se especificado
      if (selectedMonth !== 'all') {
        return mockData.filter(data => 
          `${data.month}-${data.year}` === selectedMonth
        );
      }

      return mockData;
    },
    enabled: !!teacherId,
  });
};

const useTeacherProfile = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-profile', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('taxa_comissao, chave_pix, dados_bancarios')
        .eq('id', teacherId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });
};

export default function TeacherCommissions() {
  const { profile } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('all');
  
  const { data: commissions, isLoading, error } = useTeacherCommissions(profile?.id || '', selectedMonth);
  const { data: teacherProfile } = useTeacherProfile(profile?.id || '');

  const monthOptions = [
    { value: 'all', label: 'Todos os meses' },
    { value: 'julho-2025', label: 'Julho 2025' },
    { value: 'junho-2025', label: 'Junho 2025' },
    { value: 'maio-2025', label: 'Maio 2025' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processando</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Banknote className="h-4 w-4 text-yellow-500" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Comissões</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Comissões</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar comissões</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalEarnings = commissions?.reduce((sum, month) => sum + month.totals.net_commission, 0) || 0;
  const averageAttendance = commissions?.reduce((sum, month) => sum + month.totals.attendance_rate, 0) / (commissions?.length || 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe seus ganhos e histórico de pagamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Taxa: {teacherProfile?.taxa_comissao || 0}%
          </Badge>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(totalEarnings)}
                </p>
                <p className="text-xs text-muted-foreground">Total Ganho</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{averageAttendance.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Frequência Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {commissions?.reduce((sum, month) => sum + month.totals.attended_classes, 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Aulas Ministradas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{commissions?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Meses Trabalhados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Bancários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Dados para Pagamento
          </CardTitle>
          <CardDescription>
            Informações configuradas para recebimento das comissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Chave PIX</p>
              <p className="text-sm text-muted-foreground">
                {teacherProfile?.chave_pix || 'Não configurado'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Dados Bancários</p>
              <p className="text-sm text-muted-foreground">
                {teacherProfile?.dados_bancarios 
                  ? `${teacherProfile.dados_bancarios.banco} - Ag: ${teacherProfile.dados_bancarios.agencia}`
                  : 'Não configurado'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="min-w-[180px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Comissões */}
      <div className="space-y-4">
        {commissions && commissions.length > 0 ? (
          commissions.map((monthData, index) => (
            <Card key={index} className="dance-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {monthData.month.charAt(0).toUpperCase() + monthData.month.slice(1)} {monthData.year}
                    </CardTitle>
                    <CardDescription>
                      {monthData.totals.attended_classes} aulas ministradas de {monthData.totals.total_classes} programadas
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(monthData.payment_status)}
                    {getStatusBadge(monthData.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo do Mês */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(monthData.totals.net_commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor Líquido</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(monthData.totals.gross_commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">Valor Bruto</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{monthData.totals.attendance_rate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">Taxa de Presença</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{monthData.classes.length}</p>
                    <p className="text-xs text-muted-foreground">Turmas</p>
                  </div>
                </div>

                {/* Detalhamento por Turma */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Detalhamento por Turma
                  </h4>
                  <div className="space-y-2">
                    {monthData.classes.map((classData) => (
                      <div key={classData.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{classData.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {classData.modality} • {classData.students} alunos • {classData.commission_rate}% comissão
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(classData.net_commission)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {classData.attended_classes}/{classData.total_classes} aulas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Data de Pagamento */}
                {monthData.payment_date && (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Pago em:</span>
                    </div>
                    <span className="text-sm">
                      {format(new Date(monthData.payment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    Ver Detalhes
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Comprovante
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
              <DollarSign className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-lg font-medium">Nenhuma comissão encontrada</h3>
                <p className="text-muted-foreground">
                  Você ainda não possui registros de comissões no período selecionado.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}