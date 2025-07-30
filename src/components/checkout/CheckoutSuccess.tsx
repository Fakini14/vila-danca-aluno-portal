import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  Loader2,
  Calendar,
  GraduationCap,
  ArrowRight,
  Download,
  Mail,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentData {
  id: string;
  amount: number;
  paid_date: string;
  description: string;
  status: string;
  student_id: string;
}

interface EnrollmentData {
  id: string;
  classes: {
    nome: string;
    dias_semana: string[];
    horario_inicio: string;
    horario_fim: string;
    class_types: {
      nome: string;
      color: string;
    };
  };
}

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const paymentId = searchParams.get('payment');
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    } else {
      navigate('/student/dashboard');
    }
  }, [paymentId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      // Fetch payment data
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;
      setPayment(paymentData);

      // Fetch related enrollments
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select(`
          id,
          classes(
            nome,
            dias_semana,
            horario_inicio,
            horario_fim,
            class_types(
              nome,
              color
            )
          )
        `)
        .eq('student_id', paymentData.student_id)
        .eq('ativa', true)
        .order('created_at', { ascending: false })
        .limit(5); // Get recent enrollments

      if (enrollmentError) throw enrollmentError;
      setEnrollments(enrollmentData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do pagamento.',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-green-700">Verificando seu pagamento...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Pagamento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível verificar o status do seu pagamento.
            </p>
            <Button onClick={() => navigate('/student/payments')}>
              Ver meus pagamentos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-green-600 max-w-md mx-auto">
            Sua matrícula foi processada com sucesso. Bem-vindo à Vila Dança & Arte!
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Details */}
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Detalhes do Pagamento</h3>
                  <Badge className="bg-green-100 text-green-800">
                    Confirmado
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor pago:</span>
                  <span className="font-semibold">R$ {payment.amount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data do pagamento:</span>
                  <span className="font-semibold">
                    {format(new Date(payment.paid_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descrição:</span>
                  <span className="font-semibold text-right">{payment.description}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Recibo
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Classes */}
          <Card className="border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Suas Turmas</h3>
                  <p className="text-sm text-muted-foreground">
                    {enrollments.length} turma{enrollments.length !== 1 ? 's' : ''} ativa{enrollments.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {enrollments.map((enrollment) => (
                  <div key={enrollment.id} className="p-3 border rounded-lg bg-white/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: enrollment.classes.class_types.color }}
                      />
                      <div>
                        <p className="font-medium">{enrollment.classes.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {enrollment.classes.class_types.nome}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDaysOfWeek(enrollment.classes.dias_semana)}</span>
                      </div>
                      <span>
                        {formatTime(enrollment.classes.horario_inicio)} - {formatTime(enrollment.classes.horario_fim)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="max-w-4xl mx-auto mt-8 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Próximos Passos</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-medium mb-2">Verifique seu Email</h4>
                <p className="text-sm text-muted-foreground">
                  Enviamos um email de confirmação com todas as informações
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-medium mb-2">Consulte sua Agenda</h4>
                <p className="text-sm text-muted-foreground">
                  Veja os horários das suas aulas no painel do aluno
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-medium mb-2">Compareça às Aulas</h4>
                <p className="text-sm text-muted-foreground">
                  Não esqueça de chegar 10 minutos antes do horário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="max-w-4xl mx-auto mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/student/dashboard')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Ir para o Dashboard
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/student/schedule')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Ver Agenda
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/student/payments')}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Meus Pagamentos
          </Button>
        </div>

        {/* Support Contact */}
        <div className="max-w-md mx-auto mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Dúvidas sobre sua matrícula?
          </p>
          <Button variant="link" className="text-green-600">
            Entre em contato conosco
          </Button>
        </div>
      </div>
    </div>
  );
}