import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAsaasCustomer } from '@/hooks/useAsaasCustomer';

const formSchema = z.object({
  student_id: z.string().min(1, 'Selecione um aluno'),
  class_id: z.string().min(1, 'Selecione uma turma'),
  data_matricula: z.string().min(1, 'Data de matrícula é obrigatória'),
  valor_pago_matricula: z.string().optional(),
});

interface Student {
  id: string;
  asaas_customer_id?: string;
  profiles: {
    nome_completo: string;
    email: string;
    cpf: string;
    whatsapp?: string;
    telefone?: string;
  };
}

interface Class {
  id: string;
  modalidade: string;
  nivel: string;
  horario_inicio: string;
  horario_fim: string;
  valor_matricula: number | null;
}

interface CreateEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type EnrollmentStep = 'select' | 'validate' | 'create';

export function CreateEnrollmentModal({ open, onOpenChange, onSuccess }: CreateEnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>('select');
  const [selectedStudentData, setSelectedStudentData] = useState<Student | null>(null);
  const [validationComplete, setValidationComplete] = useState(false);
  const [asaasCustomerId, setAsaasCustomerId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { ensureAsaasCustomer, validateStudentData, loading: asaasLoading, error: asaasError, clearError } = useAsaasCustomer();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: '',
      class_id: '',
      data_matricula: new Date().toISOString().split('T')[0],
      valor_pago_matricula: '',
    },
  });

  const selectedClassId = form.watch('class_id');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  useEffect(() => {
    if (open) {
      loadStudents();
      loadClasses();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClass?.valor_matricula) {
      form.setValue('valor_pago_matricula', selectedClass.valor_matricula.toString());
    }
  }, [selectedClass, form]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          asaas_customer_id,
          profiles!students_id_fkey(
            nome_completo,
            email,
            cpf,
            whatsapp,
            telefone
          )
        `)
        .order('profiles(nome_completo)');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, modalidade, nivel, horario_inicio, horario_fim, valor_matricula')
        .eq('ativa', true)
        .order('modalidade');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  // Reset states when modal opens/closes
  useEffect(() => {
    if (open) {
      setCurrentStep('select');
      setSelectedStudentData(null);
      setValidationComplete(false);
      setAsaasCustomerId(null);
      clearError();
    } else {
      form.reset();
    }
  }, [open, form, clearError]);

  // Função para validar dados do estudante
  const handleStudentValidation = async () => {
    const studentId = form.getValues('student_id');
    const student = students.find(s => s.id === studentId);
    
    if (!student) {
      toast({
        title: 'Erro',
        description: 'Selecione um aluno primeiro',
        variant: 'destructive'
      });
      return;
    }

    setSelectedStudentData(student);
    setCurrentStep('validate');

    try {
      // Verificar se já tem asaas_customer_id
      if (student.asaas_customer_id) {
        console.log('✅ Cliente Asaas já existe:', student.asaas_customer_id);
        setAsaasCustomerId(student.asaas_customer_id);
        setValidationComplete(true);
        setCurrentStep('create');
        return;
      }

      // Validar dados primeiro
      const validation = await validateStudentData(studentId);
      
      if (!validation.valid) {
        toast({
          title: 'Dados incompletos',
          description: `Para criar a matrícula, é necessário completar: ${validation.missing.join(', ')}`,
          variant: 'destructive'
        });
        return;
      }

      // Criar cliente Asaas
      const customerId = await ensureAsaasCustomer(studentId);
      setAsaasCustomerId(customerId);
      setValidationComplete(true);
      setCurrentStep('create');

      toast({
        title: 'Cliente validado',
        description: 'Dados do aluno validados com sucesso. Agora você pode criar a matrícula.',
      });
    } catch (error: Error) {
      console.error('Erro na validação:', error);
      toast({
        title: 'Erro na validação',
        description: error.message || 'Não foi possível validar os dados do aluno',
        variant: 'destructive'
      });
      setCurrentStep('select');
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Check if student is already enrolled in this class
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', values.student_id)
        .eq('class_id', values.class_id)
        .eq('ativa', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingEnrollment) {
        throw new Error('Este aluno já está matriculado nesta turma');
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: values.student_id,
          class_id: values.class_id,
          data_matricula: values.data_matricula,
          valor_pago_matricula: values.valor_pago_matricula ? parseFloat(values.valor_pago_matricula) : null,
          ativa: true,
        });

      if (error) throw error;

      toast({
        title: 'Matrícula criada com sucesso',
        description: 'O aluno foi matriculado na turma',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: Error) {
      toast({
        title: 'Erro ao criar matrícula',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get step info
  const getStepInfo = () => {
    switch (currentStep) {
      case 'select':
        return {
          title: 'Nova Matrícula - Selecionar Aluno',
          description: 'Selecione o aluno e a turma para a matrícula'
        };
      case 'validate':
        return {
          title: 'Nova Matrícula - Validando Dados',
          description: 'Verificando dados do aluno no sistema de pagamento'
        };
      case 'create':
        return {
          title: 'Nova Matrícula - Finalizar',
          description: 'Confirme os dados da matrícula'
        };
      default:
        return {
          title: 'Nova Matrícula',
          description: 'Matricule um aluno em uma turma ativa'
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{stepInfo.title}</DialogTitle>
          <DialogDescription>
            {stepInfo.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'select' ? 'bg-primary text-primary-foreground' : 
              ['validate', 'create'].includes(currentStep) ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {['validate', 'create'].includes(currentStep) ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <span className="ml-2 text-sm">Selecionar</span>
          </div>
          
          <div className={`h-px flex-1 ${['validate', 'create'].includes(currentStep) ? 'bg-green-500' : 'bg-muted'}`} />
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'validate' ? 'bg-primary text-primary-foreground' : 
              currentStep === 'create' ? 'bg-green-500 text-white' : 'bg-muted'
            }`}>
              {currentStep === 'validate' ? <Loader2 className="w-4 h-4 animate-spin" /> :
               currentStep === 'create' ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <span className="ml-2 text-sm">Validar</span>
          </div>
          
          <div className={`h-px flex-1 ${currentStep === 'create' ? 'bg-green-500' : 'bg-muted'}`} />
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 'create' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm">Criar</span>
          </div>
        </div>

        <Form {...form}>
          {/* Step 1: Select Student and Class */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="student_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aluno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            <div className="flex items-center space-x-2">
                              <span>{student.profiles.nome_completo}</span>
                              {student.asaas_customer_id && (
                                <Badge variant="secondary" className="ml-2">
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  Cadastrado
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma turma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id}>
                            {classItem.modalidade} - {classItem.nivel} 
                            ({classItem.horario_inicio} - {classItem.horario_fim})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleStudentValidation}
                  disabled={!form.getValues('student_id') || !form.getValues('class_id')}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Validation */}
          {currentStep === 'validate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <h3 className="text-lg font-semibold mb-2">
                    Validando dados do aluno
                  </h3>
                  <p className="text-muted-foreground">
                    Verificando se o aluno possui cadastro no sistema de pagamento...
                  </p>
                </div>
              </div>
              
              {asaasError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {asaasError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Step 3: Create Enrollment */}
          {currentStep === 'create' && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Show selected student info */}
              {selectedStudentData && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Aluno:</strong> {selectedStudentData.profiles.nome_completo} - {selectedStudentData.profiles.email}
                    <br />
                    <strong>Sistema de pagamento:</strong> 
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Validado
                    </Badge>
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="data_matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Matrícula</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_pago_matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago da Matrícula (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep('select')}
                  disabled={loading}
                >
                  Voltar
                </Button>
                
                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      'Criar Matrícula'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </Form>
      </DialogContent>
    </Dialog>
  );
}