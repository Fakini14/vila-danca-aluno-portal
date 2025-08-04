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
      
      // Get current student enrollments (both active and inactive to prevent duplicates)
      const { data: currentEnrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('class_id, ativa')
        .eq('student_id', profile.id);

      if (enrollmentError) throw enrollmentError;

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
      const { data: enrollmentCounts, error: countError } = await supabase
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('ativa', true);

      if (countError) {
        console.warn('Erro ao contar matrículas:', countError);
        // Continue without enrollment counts
      }

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
    } catch (error: unknown) {
      console.error('Erro ao buscar turmas:', error);
      
      let errorMessage = 'Não foi possível carregar as turmas disponíveis.';
      
      const errorObj = error as { message?: string; status?: number };
      if (errorObj?.message?.includes('No authorization header') || errorObj?.message?.includes('No API key')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (errorObj?.status === 401) {
        errorMessage = 'Acesso não autorizado. Faça login novamente.';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
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
      const monthlyValue = classItem.valor_aula || 150; // Use valor_aula for monthly subscription

      // First, check if enrollment already exists (active or inactive)
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id, ativa')
        .eq('student_id', profile.id)
        .eq('class_id', classItem.id)
        .maybeSingle();

      if (checkError) throw checkError;

      let enrollment;

      if (existingEnrollment) {
        if (existingEnrollment.ativa) {
          toast({
            title: 'Já matriculado',
            description: 'Você já está matriculado nesta turma.',
            variant: 'destructive',
          });
          return;
        } else {
          // Reactivate existing enrollment
          const { data: reactivatedEnrollment, error: reactivateError } = await supabase
            .from('enrollments')
            .update({ 
              ativa: false, // Will be activated after payment
              data_matricula: enrollmentDate,
              valor_pago_matricula: 0
            })
            .eq('id', existingEnrollment.id)
            .select()
            .single();

          if (reactivateError) throw reactivateError;
          enrollment = reactivatedEnrollment;
        }
      } else {
        // Create new enrollment (initially inactive - will be activated after first payment)
        const { data: newEnrollment, error: enrollmentError } = await supabase
          .from('enrollments')
          .insert({
            student_id: profile.id,
            class_id: classItem.id,
            data_matricula: enrollmentDate,
            valor_pago_matricula: 0, // No enrollment fee for subscriptions
            ativa: false, // Will be activated after first payment
          })
          .select()
          .single();

        if (enrollmentError) throw enrollmentError;
        enrollment = newEnrollment;
      }

      // Call create-subscription-checkout edge function
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          student_id: profile.id,
          enrollment_id: enrollment.id,
          class_id: classItem.id,
          billing_type: 'CREDIT_CARD', // Default to credit card for better UX
          customer: {
            name: profile.nome_completo,
            email: profile.email,
            cpfCnpj: profile.cpf,
            phone: profile.whatsapp || profile.telefone
          },
          value: monthlyValue,
          class_name: classItem.nome || classItem.modalidade,
          due_day: 10 // Default to 10th of each month
        }
      });

      if (checkoutError) {
        console.error('Checkout creation error:', checkoutError);
        
        // Verificar se há uma mensagem de erro específica do usuário
        const errorData = checkoutError.context?.body;
        const userMessage = errorData?.userMessage || checkoutError.message;
        
        // Se for erro de configuração, mostrar mensagem especial
        if (errorData?.error?.includes('Asaas credentials not configured') || checkoutError.status === 503) {
          toast({
            title: 'Configuração Pendente',
            description: 'O sistema de pagamento ainda não foi configurado. Entre em contato com a administração.',
            variant: 'destructive'
          });
          return;
        }
        
        throw new Error(`Erro ao criar checkout: ${userMessage || 'Tente novamente'}`);
      }

      if (checkoutData?.checkout?.url) {
        // Redirect to Asaas checkout page
        window.location.href = checkoutData.checkout.url;
      } else {
        toast({
          title: 'Erro no checkout',
          description: 'Não foi possível gerar o link de pagamento. Tente novamente.',
          variant: 'destructive'
        });
      }

    } catch (error: unknown) {
      console.error('Erro ao iniciar matrícula:', error);
      
      let errorMessage = 'Não foi possível iniciar o processo de matrícula. Tente novamente.';
      
      // Handle specific error cases
      const errorObj = error as { code?: string; message?: string; status?: number };
      if (errorObj?.code === '23505' || errorObj?.message?.includes('duplicate key')) {
        errorMessage = 'Você já possui uma matrícula para esta turma. Verifique suas assinaturas ativas.';
      } else if (errorObj?.message?.includes('No authorization header') || errorObj?.message?.includes('No API key')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (errorObj?.status === 401) {
        errorMessage = 'Acesso não autorizado. Verifique suas credenciais.';
      } else if (errorObj?.message?.includes('Configuração Pendente') || errorObj?.message?.includes('Asaas credentials')) {
        errorMessage = 'O sistema de pagamento ainda não foi configurado. Entre em contato com a administração.';
      } else if (errorObj?.message) {
        // Use a mensagem do erro se disponível
        errorMessage = errorObj.message;
      }
      
      toast({
        title: 'Erro na matrícula',
        description: errorMessage,
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
                  <div className="mb-3">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Assinatura Mensal</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(classItem.valor_aula)}/mês
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Cobrança automática todo dia 10
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
                        Criando assinatura...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isFull ? 'Turma Lotada' : 'Assinar Mensalidade'}
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