import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar, Users, MapPin, ShoppingCart, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Class {
  id: string;
  nome: string | null;
  modalidade: string;
  nivel: string;
  tipo: string;
  data_inicio: string;
  data_termino: string | null;
  horario_inicio: string;
  horario_fim: string;
  dias_semana: string[];
  valor_aula: number;
  valor_matricula: number | null;
  capacidade_maxima: number | null;
  ativa: boolean;
  professor_principal_id: string | null;
  sala: string | null;
  class_teachers: Array<{
    staff: {
      profiles: {
        nome_completo: string;
      };
    };
  }>;
  current_enrollments?: number;
}

export function StudentAvailableClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingClass, setEnrollingClass] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id) {
      fetchAvailableClasses();
    }
  }, [profile?.id]);

  const fetchAvailableClasses = async () => {
    try {
      if (!profile?.id) return;
      
      // Get current student enrollments
      const { data: currentEnrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profile.id)
        .eq('ativa', true);

      const enrolledClassIds = currentEnrollments?.map(e => e.class_id) || [];

      // Get all available classes with detailed info
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_teachers(
            staff(
              profiles(
                nome_completo
              )
            )
          )
        `)
        .eq('ativa', true)
        .order('modalidade', { ascending: true });

      if (error) throw error;

      // Count current enrollments for each class
      const classIds = data?.map(c => c.id) || [];
      const { data: enrollmentCounts } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('ativa', true);

      const enrollmentCountMap = enrollmentCounts?.reduce((acc, curr) => {
        acc[curr.class_id] = (acc[curr.class_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Filter out classes where student is already enrolled and add enrollment counts
      const availableClasses: Class[] = data
        ?.filter(cls => !enrolledClassIds.includes(cls.id))
        .map(cls => ({
          ...cls,
          current_enrollments: enrollmentCountMap[cls.id] || 0,
        })) || [];

      setClasses(availableClasses);
    } catch (error) {
      console.error('Erro ao buscar turmas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas disponíveis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDaysOfWeek = (days: string[]) => {
    const daysMap: { [key: string]: string } = {
      'segunda': 'Seg',
      'terca': 'Ter',
      'quarta': 'Qua',
      'quinta': 'Qui',
      'sexta': 'Sex',
      'sabado': 'Sáb',
      'domingo': 'Dom'
    };
    return days.map(day => daysMap[day] || day).join(', ');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getModalityColor = (modalidade: string) => {
    const colors: Record<string, string> = {
      'Ballet': '#f472b6',
      'Jazz': '#fbbf24',
      'Hip Hop': '#8b5cf6',
      'Dança Contemporânea': '#06b6d4',
      'Dança de Salão': '#ef4444',
      'Sapateado': '#10b981',
      'Teatro Musical': '#f59e0b',
      'Acrobático': '#6366f1',
      'default': '#6b7280'
    };
    return colors[modalidade] || colors.default;
  };

  const handleEnrollment = async (classItem: Class) => {
    if (!profile?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para se matricular.',
        variant: 'destructive',
      });
      return;
    }

    setEnrollingClass(classItem.id);

    try {
      const enrollmentDate = new Date().toISOString().split('T')[0];
      const matriculaFee = classItem.valor_matricula || 50; // Default enrollment fee

      // Create enrollment (initially inactive)
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: profile.id,
          class_id: classItem.id,
          data_matricula: enrollmentDate,
          valor_pago_matricula: matriculaFee,
          ativa: false, // Will be activated after payment
        })
        .select()
        .single();

      if (enrollmentError) throw enrollmentError;

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: profile.id,
          enrollment_id: enrollment.id,
          amount: matriculaFee,
          due_date: enrollmentDate,
          status: 'pendente',
          description: `Taxa de matrícula - ${classItem.nome}`,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Call create-enrollment-payment edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-enrollment-payment', {
        body: {
          payment_id: payment.id,
          student_id: profile.id,
          enrollment_ids: [enrollment.id],
          amount: matriculaFee,
          description: `Matrícula - ${classItem.nome}`,
          due_date: enrollmentDate,
          customer: {
            name: profile.nome_completo,
            email: profile.email,
            cpfCnpj: profile.cpf,
            phone: profile.whatsapp || profile.telefone
          }
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData?.checkout_url) {
        // Redirect to checkout page
        window.location.href = `/checkout/${payment.id}`;
      } else {
        throw new Error('URL de checkout não foi gerada');
      }

    } catch (error) {
      console.error('Erro ao iniciar matrícula:', error);
      toast({
        title: 'Erro na matrícula',
        description: 'Não foi possível iniciar o processo de matrícula. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setEnrollingClass(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando turmas disponíveis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Turmas Disponíveis</h2>
        <p className="text-muted-foreground">
          Descubra novas modalidades e expanda seus conhecimentos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => {
          const maxCapacity = classItem.capacidade_maxima || 20; // Default capacity
          const isFull = (classItem.current_enrollments || 0) >= maxCapacity;
          const spotsLeft = maxCapacity - (classItem.current_enrollments || 0);
          
          return (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getModalityColor(classItem.modalidade) }}
                      />
                      <CardTitle className="text-lg">{classItem.nome || classItem.modalidade}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{classItem.modalidade}</Badge>
                      <Badge variant="outline">{classItem.nivel}</Badge>
                      {isFull && <Badge variant="destructive">Lotada</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDaysOfWeek(classItem.dias_semana)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatTime(classItem.horario_inicio)} - {formatTime(classItem.horario_fim)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {classItem.current_enrollments || 0}/{maxCapacity} alunos
                      {!isFull && spotsLeft <= 3 && (
                        <span className="text-amber-600 ml-1">({spotsLeft} vagas)</span>
                      )}
                    </span>
                  </div>

                  {classItem.class_teachers?.[0] && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Prof. {classItem.class_teachers[0].staff?.profiles?.nome_completo}</span>
                    </div>
                  )}

                  {classItem.sala && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Sala: {classItem.sala}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Valor por aula</div>
                      <div className="font-semibold">{formatCurrency(classItem.valor_aula)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Taxa matrícula</div>
                      <div className="font-semibold">
                        {formatCurrency(classItem.valor_matricula || 50)}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={isFull || enrollingClass === classItem.id}
                    onClick={() => handleEnrollment(classItem)}
                  >
                    {enrollingClass === classItem.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isFull ? 'Turma Lotada' : 'Matricular-se'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-8">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma turma disponível</h3>
            <p className="text-muted-foreground mb-4">
              Você já está matriculado em todas as turmas disponíveis ou não há turmas ativas no momento.
            </p>
            <Button variant="outline" onClick={fetchAvailableClasses}>
              <Calendar className="h-4 w-4 mr-2" />
              Atualizar Lista
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}