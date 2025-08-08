import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Calendar, Users, MapPin, ShoppingCart, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAsaasCustomer } from '@/hooks/useAsaasCustomer';

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
  ativa: boolean;
  professor_principal_id: string | null;
  professor?: {
    nome_completo: string;
  } | null;
  current_enrollments?: number;
}

export function StudentAvailableClasses() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingClass, setEnrollingClass] = useState<string | null>(null);
  const [validatingStudent, setValidatingStudent] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { profile } = useAuth();
  const { ensureAsaasCustomer, validateStudentData } = useAsaasCustomer();

  const fetchAvailableClasses = useCallback(async () => {
    try {
      if (!profile?.id) return;
      
      // Get current student enrollments (only ACTIVE enrollments to allow re-enrollment)
      const { data: currentEnrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', profile.id)
        .eq('ativa', true); // Only consider ACTIVE enrollments

      if (enrollmentError) throw enrollmentError;

      const enrolledClassIds = currentEnrollments?.map(e => e.class_id) || [];
      
      console.log('🔍 Active enrollments found:', {
        studentId: profile.id,
        activeEnrollments: currentEnrollments?.length || 0,
        enrolledClassIds
      });

      // Get all available classes with detailed info
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          professor:profiles!professor_principal_id(
            nome_completo
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
  }, [profile?.id, toast]);

  useEffect(() => {
    if (profile?.id) {
      fetchAvailableClasses();
    }
  }, [fetchAvailableClasses, profile?.id]);

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


  // Função para pré-validar dados do estudante
  const handlePreValidation = async (classItem: Class) => {
    if (!profile?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para se matricular.',
        variant: 'destructive',
      });
      return;
    }

    setValidatingStudent(classItem.id);
    setValidationError(null);
    
    console.log('🔍 Iniciando pré-validação para usuário:', profile.id);
    console.log('📞 Dados do usuário para validação:', {
      nome: profile.nome_completo,
      email: profile.email,
      cpf: profile.cpf,
      whatsapp: profile.whatsapp
    });

    try {
      // Primeiro validar dados do estudante
      console.log('🔍 Pré-validação: Verificando dados do estudante...');
      const validation = await validateStudentData(profile.id);
      
      if (!validation.valid) {
        const missingFields = validation.missing.join(', ');
        setValidationError(`Para se matricular, é necessário completar os seguintes dados em seu perfil: ${missingFields}`);
        toast({
          title: 'Dados incompletos',
          description: `Complete os dados em seu perfil: ${missingFields}`,
          variant: 'destructive'
        });
        return;
      }

      console.log('✅ Pré-validação: Dados do estudante válidos!');
      toast({
        title: 'Dados validados',
        description: 'Seus dados foram validados. Iniciando processo de matrícula...',
      });

      // Se chegou até aqui, pode prosseguir com a matrícula
      await proceedWithEnrollment(classItem);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação dos dados';
      console.error('❌ Erro na pré-validação:', error);
      setValidationError(errorMessage);
      toast({
        title: 'Erro na validação',
        description: error instanceof Error ? error.message : 'Não foi possível validar seus dados',
        variant: 'destructive'
      });
    } finally {
      setValidatingStudent(null);
    }
  };

  // Função para prosseguir com a matrícula após validação
  const proceedWithEnrollment = async (classItem: Class) => {
    if (!profile?.id) return;

    setEnrollingClass(classItem.id);

    const isDev = import.meta.env.DEV;
    const addDebug = (message: string) => {
      if (isDev) {
        console.log('🔍 [CHECKOUT]', message);
      }
    };

    try {
      addDebug(`Iniciando processo de checkout...`);
      addDebug(`Student ID: ${profile.id}`);
      addDebug(`Class ID: ${classItem.id}`);

      // Chamar Edge Function create-subscription-checkout
      addDebug('Chamando Edge Function create-subscription-checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: { 
          student_id: profile.id, 
          class_id: classItem.id,
          create_enrollment: true  // 🚀 PRODUÇÃO: integração completa
        }
      });

      addDebug(`Resposta Edge Function: ${JSON.stringify(data, null, 2)}`);

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Nenhuma resposta da Edge Function');
      }

      // Verificar se foi bem-sucedida
      if (!data.success) {
        const errorMessage = data.error || data.message || 'Erro desconhecido na criação do checkout';
        throw new Error(errorMessage);
      }

      // Se há URL de checkout, redirecionar
      if (data.checkout_url) {
        addDebug(`Checkout criado com sucesso! URL: ${data.checkout_url}`);
        
        toast({
          title: 'Redirecionando para pagamento',
          description: `Criando checkout para ${classItem.nome || classItem.modalidade}...`,
        });
        
        // Pequeno delay para mostrar o toast antes do redirect
        setTimeout(() => {
          addDebug(`Redirecionando para: ${data.checkout_url}`);
          window.location.href = data.checkout_url;
        }, 1500);
        
      } else {
        // Caso especial: enrollment já ativo ou processamento sem checkout
        const message = data.message || 'Matrícula processada com sucesso';
        
        toast({
          title: 'Matrícula realizada!',
          description: message,
        });

        // Refresh the available classes list
        fetchAvailableClasses();
      }

    } catch (error: unknown) {
      console.error('❌ Erro no processo de checkout:', error);
      
      let errorMessage = 'Não foi possível iniciar o processo de matrícula. Tente novamente.';
      
      const errorObj = error as { code?: string; message?: string; status?: number; details?: string };
      
      // Tratar erros específicos da Edge Function
      if (errorObj?.message?.includes('Estudante já matriculado')) {
        errorMessage = 'Você já está matriculado nesta turma.';
      } else if (errorObj?.message?.includes('Turma inativa') || errorObj?.message?.includes('Turma não encontrada')) {
        errorMessage = 'Esta turma não está mais disponível para matrícula.';
      } else if (errorObj?.message?.includes('Estudante não encontrado')) {
        errorMessage = 'Erro nos dados do seu perfil. Entre em contato com o suporte.';
      } else if (errorObj?.message?.includes('dados incompletos') || errorObj?.message?.includes('dados obrigatórios')) {
        errorMessage = 'Complete os dados do seu perfil antes de se matricular.';
      } else if (errorObj?.message?.includes('Asaas') || errorObj?.message?.includes('pagamento')) {
        errorMessage = 'Erro no sistema de pagamento. Tente novamente em alguns minutos.';
      } else if (errorObj?.message?.includes('No authorization header') || errorObj?.message?.includes('No API key')) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (errorObj?.status === 401) {
        errorMessage = 'Acesso não autorizado. Verifique suas credenciais.';
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      }
      
      toast({
        title: 'Erro no checkout',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setEnrollingClass(null);
    }
  };

  // Função principal que iniciará todo o processo
  const handleEnrollment = (classItem: Class) => {
    handlePreValidation(classItem);
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

      {/* Alert de erro de validação */}
      {validationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {validationError}
            <br />
            <span className="text-sm mt-2">
              Para completar seus dados, acesse Configurações → Perfil no menu do sistema.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((classItem) => {
          return (
            <Card key={classItem.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{classItem.nome || classItem.modalidade}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{classItem.modalidade}</Badge>
                      <Badge variant="outline">{classItem.nivel}</Badge>
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
                      {classItem.current_enrollments || 0} alunos matriculados
                    </span>
                  </div>

                  {classItem.professor && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Prof. {classItem.professor.nome_completo}</span>
                    </div>
                  )}

                </div>

                <div className="border-t pt-4">
                  <div className="mb-3">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Valor da Mensalidade</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(classItem.valor_aula)}/mês
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Pagamento direto na escola
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    disabled={enrollingClass === classItem.id || validatingStudent === classItem.id}
                    onClick={() => handleEnrollment(classItem)}
                  >
                    {validatingStudent === classItem.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validando dados...
                      </>
                    ) : enrollingClass === classItem.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando assinatura...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Matricular-se
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