import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, GraduationCap, Clock, DollarSign, Users, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EnrollmentModal } from './forms/EnrollmentModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Enrollment {
  id: string;
  ativa: boolean;
  data_matricula: string;
  valor_pago_matricula: number | null;
  class: {
    id: string;
    nome: string;
    valor_mensal: number;
    dias_semana: string[];
    horario_inicio: string;
    horario_fim: string;
    capacidade_maxima: number;
    class_type: {
      id: string;
      nome: string;
      color: string;
    };
    teacher: {
      id: string;
      nome_completo: string;
    };
    current_enrollments: number;
  };
}

interface EnrollmentsTabProps {
  studentId: string;
}

export function EnrollmentsTab({ studentId }: EnrollmentsTabProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          classes!enrollments_class_id_fkey(
            id,
            nome,
            valor_mensal,
            dias_semana,
            horario_inicio,
            horario_fim,
            capacidade_maxima,
            class_types(
              id,
              nome,
              color
            ),
            class_teachers(
              staff(
                profiles(
                  nome_completo
                )
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Count current enrollments for each class
      const classIds = data?.map(e => e.classes?.id).filter(Boolean) || [];
      
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('ativa', true);

      const enrollmentCountMap = enrollmentCounts?.reduce((acc, curr) => {
        acc[curr.class_id] = (acc[curr.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const processedEnrollments: Enrollment[] = data?.map(enrollment => ({
        id: enrollment.id,
        ativa: enrollment.ativa,
        data_matricula: enrollment.data_matricula,
        valor_pago_matricula: enrollment.valor_pago_matricula,
        class: {
          id: enrollment.classes?.id || '',
          nome: enrollment.classes?.nome || '',
          valor_mensal: enrollment.classes?.valor_mensal || 0,
          dias_semana: enrollment.classes?.dias_semana || [],
          horario_inicio: enrollment.classes?.horario_inicio || '',
          horario_fim: enrollment.classes?.horario_fim || '',
          capacidade_maxima: enrollment.classes?.capacidade_maxima || 0,
          class_type: {
            id: enrollment.classes?.class_types?.id || '',
            nome: enrollment.classes?.class_types?.nome || '',
            color: enrollment.classes?.class_types?.color || '#6366f1',
          },
          teacher: {
            id: enrollment.classes?.class_teachers?.[0]?.staff?.profiles?.id || '',
            nome_completo: enrollment.classes?.class_teachers?.[0]?.staff?.profiles?.nome_completo || 'Professor não definido',
          },
          current_enrollments: enrollmentCountMap[enrollment.classes?.id || ''] || 0,
        }
      })) || [];

      setEnrollments(processedEnrollments);
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as matrículas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  const handleToggleEnrollment = async (enrollmentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({ ativa: !currentStatus })
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Matrícula ${!currentStatus ? 'ativada' : 'desativada'} com sucesso`,
      });

      fetchEnrollments();
    } catch (error) {
      console.error('Erro ao alterar status da matrícula:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o status da matrícula',
        variant: 'destructive'
      });
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayNames: Record<string, string> = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };

    return days.map(day => dayNames[day] || day).join(', ');
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter(e => e.ativa);
  const inactiveEnrollments = enrollments.filter(e => !e.ativa);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Mensal Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activeEnrollments.reduce((sum, e) => sum + e.class.valor_mensal, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button 
          className="dance-gradient"
          onClick={() => setEnrollmentModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      {/* Active Enrollments */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Matrículas Ativas ({activeEnrollments.length})</h3>
        {activeEnrollments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Nenhuma matrícula ativa encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-l-4" style={{ borderLeftColor: enrollment.class.class_type.color }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">{enrollment.class.nome}</h4>
                        <Badge 
                          style={{ 
                            backgroundColor: `${enrollment.class.class_type.color}20`,
                            color: enrollment.class.class_type.color,
                            borderColor: enrollment.class.class_type.color 
                          }}
                          variant="outline"
                        >
                          {enrollment.class.class_type.nome}
                        </Badge>
                        <Badge variant="default">Ativa</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>{enrollment.class.teacher.nome_completo}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatDaysOfWeek(enrollment.class.dias_semana)} • {' '}
                            {formatTime(enrollment.class.horario_inicio)} - {formatTime(enrollment.class.horario_fim)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {enrollment.class.valor_mensal.toFixed(2)}/mês</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{enrollment.class.current_enrollments}/{enrollment.class.capacidade_maxima} alunos</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Matriculado em: {formatDate(enrollment.data_matricula)}
                        {enrollment.valor_pago_matricula && (
                          <> • Taxa de matrícula: R$ {enrollment.valor_pago_matricula.toFixed(2)}</>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <ToggleRight className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-500" />
                              Desativar Matrícula
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desativar a matrícula em <strong>{enrollment.class.nome}</strong>?
                              Esta ação interromperá os pagamentos mensais, mas não excluirá o histórico.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleToggleEnrollment(enrollment.id, enrollment.ativa)}
                              className="bg-amber-500 hover:bg-amber-600"
                            >
                              Desativar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Enrollments */}
      {inactiveEnrollments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Matrículas Inativas ({inactiveEnrollments.length})</h3>
          <div className="grid gap-4">
            {inactiveEnrollments.map((enrollment) => (
              <Card key={enrollment.id} className="border-l-4 opacity-75" style={{ borderLeftColor: '#6b7280' }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-lg">{enrollment.class.nome}</h4>
                        <Badge 
                          style={{ 
                            backgroundColor: `${enrollment.class.class_type.color}10`,
                            color: enrollment.class.class_type.color,
                            borderColor: enrollment.class.class_type.color 
                          }}
                          variant="outline"
                        >
                          {enrollment.class.class_type.nome}
                        </Badge>
                        <Badge variant="secondary">Inativa</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm opacity-75">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span>{enrollment.class.teacher.nome_completo}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {formatDaysOfWeek(enrollment.class.dias_semana)} • {' '}
                            {formatTime(enrollment.class.horario_inicio)} - {formatTime(enrollment.class.horario_fim)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {enrollment.class.valor_mensal.toFixed(2)}/mês</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{enrollment.class.current_enrollments}/{enrollment.class.capacidade_maxima} alunos</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-2">
                        Matriculado em: {formatDate(enrollment.data_matricula)}
                        {enrollment.valor_pago_matricula && (
                          <> • Taxa de matrícula: R$ {enrollment.valor_pago_matricula.toFixed(2)}</>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleEnrollment(enrollment.id, enrollment.ativa)}
                      >
                        <ToggleLeft className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <EnrollmentModal
        open={enrollmentModalOpen}
        onOpenChange={setEnrollmentModalOpen}
        studentId={studentId}
        onSuccess={fetchEnrollments}
      />
    </div>
  );
}