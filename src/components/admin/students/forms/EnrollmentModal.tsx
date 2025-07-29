import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Clock, DollarSign, Users, GraduationCap, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';

interface AvailableClass {
  id: string;
  nome: string;
  valor_mensal: number;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  capacidade_maxima: number;
  current_enrollments: number;
  class_type: {
    id: string;
    nome: string;
    color: string;
  };
  teacher: {
    nome_completo: string;
  };
}

interface EnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onSuccess: () => void;
}

type PaymentMethod = 'pix' | 'boleto' | 'cartao' | 'dinheiro';

type EnrollmentStep = 1 | 2 | 3;

export function EnrollmentModal({ open, onOpenChange, studentId, onSuccess }: EnrollmentModalProps) {
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>(1);
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [enrollmentDate, setEnrollmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [matriculaFee, setMatriculaFee] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAvailableClasses();
      setCurrentStep(1);
      setSelectedClasses([]);
      setEnrollmentDate(format(new Date(), 'yyyy-MM-dd'));
      setMatriculaFee(0);
      setSelectedPaymentMethod('dinheiro');
    }
  }, [open, studentId, fetchAvailableClasses]);

  const fetchAvailableClasses = useCallback(async () => {
    try {
      setFetchingClasses(true);
      
      // Get current student enrollments
      const { data: currentEnrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('student_id', studentId)
        .eq('ativa', true);

      const enrolledClassIds = currentEnrollments?.map(e => e.class_id) || [];

      // Get all available classes
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
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
        `)
        .eq('ativa', true);

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

      // Filter out classes where student is already enrolled and format data
      const processedClasses: AvailableClass[] = data
        ?.filter(cls => !enrolledClassIds.includes(cls.id))
        .map(cls => ({
          id: cls.id,
          nome: cls.nome,
          valor_mensal: cls.valor_mensal,
          dias_semana: cls.dias_semana,
          horario_inicio: cls.horario_inicio,
          horario_fim: cls.horario_fim,
          capacidade_maxima: cls.capacidade_maxima,
          current_enrollments: enrollmentCountMap[cls.id] || 0,
          class_type: {
            id: cls.class_types?.id || '',
            nome: cls.class_types?.nome || '',
            color: cls.class_types?.color || '#6366f1',
          },
          teacher: {
            nome_completo: cls.class_teachers?.[0]?.staff?.profiles?.nome_completo || 'Professor não definido',
          },
        })) || [];

      setAvailableClasses(processedClasses);
    } catch (error) {
      console.error('Erro ao buscar turmas disponíveis:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as turmas disponíveis',
        variant: 'destructive'
      });
    } finally {
      setFetchingClasses(false);
    }
  }, [studentId, toast]);

  const handleClassToggle = (classId: string, checked: boolean) => {
    if (checked) {
      setSelectedClasses(prev => [...prev, classId]);
    } else {
      setSelectedClasses(prev => prev.filter(id => id !== classId));
    }
  };

  const checkForScheduleConflicts = (newClassId: string): boolean => {
    const newClass = availableClasses.find(c => c.id === newClassId);
    if (!newClass) return false;

    const selectedClassesData = availableClasses.filter(c => selectedClasses.includes(c.id));
    
    for (const existingClass of selectedClassesData) {
      // Check if there's overlap in days
      const commonDays = newClass.dias_semana.filter(day => existingClass.dias_semana.includes(day));
      
      if (commonDays.length > 0) {
        // Check time overlap
        const newStart = newClass.horario_inicio;
        const newEnd = newClass.horario_fim;
        const existingStart = existingClass.horario_inicio;
        const existingEnd = existingClass.horario_fim;
        
        if (
          (newStart < existingEnd && newEnd > existingStart) ||
          (existingStart < newEnd && existingEnd > newStart)
        ) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleSubmit = async () => {
    if (selectedClasses.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma turma para matrícula',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Create enrollments for selected classes
      const enrollmentsData = selectedClasses.map(classId => ({
        student_id: studentId,
        class_id: classId,
        data_matricula: enrollmentDate,
        valor_pago_matricula: matriculaFee / selectedClasses.length, // Distribute fee across classes
        ativa: true,
      }));

      const { data: enrollments, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollmentsData)
        .select();

      if (enrollmentError) throw enrollmentError;

      // If there's a registration fee and payment method is cash, create payment record
      if (matriculaFee > 0) {
        const paymentData = {
          student_id: studentId,
          enrollment_id: enrollments?.[0]?.id || null,
          amount: matriculaFee,
          due_date: enrollmentDate,
          status: selectedPaymentMethod === 'dinheiro' ? 'pago' : 'pendente',
          paid_date: selectedPaymentMethod === 'dinheiro' ? enrollmentDate : null,
          payment_method: selectedPaymentMethod,
          description: `Taxa de matrícula - ${selectedClasses.length} turma${selectedClasses.length > 1 ? 's' : ''}`,
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentData);

        if (paymentError) {
          console.error('Erro ao criar registro de pagamento:', paymentError);
          // Don't throw error here, enrollment was successful
        }
      }

      toast({
        title: 'Sucesso',
        description: `Aluno matriculado em ${selectedClasses.length} turma${selectedClasses.length > 1 ? 's' : ''} com sucesso`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar matrículas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar as matrículas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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

  const selectedClassesData = availableClasses.filter(c => selectedClasses.includes(c.id));
  const totalMonthlyValue = selectedClassesData.reduce((sum, c) => sum + c.valor_mensal, 0);

  const handleNext = () => {
    if (currentStep === 1 && selectedClasses.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma turma para continuar',
        variant: 'destructive'
      });
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as EnrollmentStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as EnrollmentStep);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Selecionar Turmas';
      case 2: return 'Confirmar Dados';
      case 3: return 'Forma de Pagamento';
      default: return 'Nova Matrícula';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mt-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-0.5 ml-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Selecionar Turmas */}
          {currentStep === 1 && (
            <>
              <div>
                <h4 className="font-medium mb-4">Turmas Disponíveis</h4>
                
                {fetchingClasses ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : availableClasses.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Nenhuma turma disponível para matrícula
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableClasses.map((cls) => {
                      const isSelected = selectedClasses.includes(cls.id);
                      const hasConflict = !isSelected && checkForScheduleConflicts(cls.id);
                      const isFull = cls.current_enrollments >= cls.capacidade_maxima;
                      const isDisabled = hasConflict || isFull;

                      return (
                        <div
                          key={cls.id}
                          className={`border rounded-lg p-4 transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : isDisabled
                              ? 'border-muted bg-muted/30 opacity-60'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={cls.id}
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={(checked) => handleClassToggle(cls.id, checked as boolean)}
                            />
                            
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <label
                                  htmlFor={cls.id}
                                  className={`font-medium cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                                >
                                  {cls.nome}
                                </label>
                                <Badge
                                  style={{
                                    backgroundColor: `${cls.class_type.color}20`,
                                    color: cls.class_type.color,
                                    borderColor: cls.class_type.color
                                  }}
                                  variant="outline"
                                >
                                  {cls.class_type.nome}
                                </Badge>
                                {isFull && (
                                  <Badge variant="destructive">Turma Lotada</Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{cls.teacher.nome_completo}</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {formatDaysOfWeek(cls.dias_semana)} • {' '}
                                    {formatTime(cls.horario_inicio)} - {formatTime(cls.horario_fim)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4" />
                                  <span>R$ {cls.valor_mensal.toFixed(2)}/mês</span>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>{cls.current_enrollments}/{cls.capacidade_maxima} alunos</span>
                                </div>
                              </div>

                              {hasConflict && (
                                <div className="flex items-center gap-2 mt-2 text-amber-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-xs">Conflito de horário com turma selecionada</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedClasses.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Turmas Selecionadas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Quantidade:</p>
                      <p className="font-medium">{selectedClasses.length} turma{selectedClasses.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor mensal total:</p>
                      <p className="font-medium">R$ {totalMonthlyValue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 2: Confirmar Valores */}
          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <h4 className="font-medium">Dados da Matrícula</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="enrollmentDate">Data da Matrícula</Label>
                    <Input
                      id="enrollmentDate"
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="matriculaFee">Taxa de Matrícula (R$)</Label>
                    <Input
                      id="matriculaFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={matriculaFee}
                      onChange={(e) => setMatriculaFee(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-4">Resumo da Matrícula</h4>
                <div className="space-y-3">
                  {selectedClassesData.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{cls.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDaysOfWeek(cls.dias_semana)} • {formatTime(cls.horario_inicio)} - {formatTime(cls.horario_fim)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R$ {cls.valor_mensal.toFixed(2)}/mês</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total de turmas:</p>
                      <p className="font-medium">{selectedClasses.length}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Valor mensal total:</p>
                      <p className="font-medium">R$ {totalMonthlyValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de matrícula:</p>
                      <p className="font-medium">R$ {matriculaFee.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Step 3: Forma de Pagamento */}
          {currentStep === 3 && (
            <>
              <div>
                <h4 className="font-medium mb-4">Forma de Pagamento da Matrícula</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'dinheiro', label: 'Dinheiro', description: 'Pagamento em espécie' },
                    { id: 'pix', label: 'PIX', description: 'Transferência instantânea' },
                    { id: 'boleto', label: 'Boleto', description: 'Boleto bancário' },
                    { id: 'cartao', label: 'Cartão', description: 'Cartão de crédito/débito' },
                  ].map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedPaymentMethod === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            selectedPaymentMethod === method.id
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}
                        />
                        <div>
                          <p className="font-medium">{method.label}</p>
                          <p className="text-sm text-muted-foreground">{method.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPaymentMethod === 'dinheiro' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Pagamento em dinheiro será registrado como pago após confirmação do recebimento.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod !== 'dinheiro' && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ A integração com gateway de pagamento será implementada em breve.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Resumo Final</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Turmas:</p>
                    <p className="font-medium">{selectedClasses.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor mensal:</p>
                    <p className="font-medium">R$ {totalMonthlyValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Taxa matrícula:</p>
                    <p className="font-medium">R$ {matriculaFee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Forma pagamento:</p>
                    <p className="font-medium capitalize">{selectedPaymentMethod}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Navigation Actions */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
              )}
            </div>
            
            <div>
              {currentStep < 3 ? (
                <Button onClick={handleNext} className="dance-gradient">
                  Próximo
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="dance-gradient"
                >
                  {loading ? 'Matriculando...' : 'Finalizar Matrícula'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}