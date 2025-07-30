import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  CreditCard,
  Smartphone,
  FileText,
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Shield,
  Lock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentData {
  id: string;
  amount: number;
  due_date: string;
  description: string;
  status: string;
  asaas_payment_id?: string;
  asaas_invoice_url?: string;
  enrollment_id?: string;
  created_at: string;
}

interface EnrollmentData {
  id: string;
  classes: {
    nome: string;
    class_types: {
      nome: string;
      color: string;
    };
  };
}

export function CheckoutPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
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
            class_types(
              nome,
              color
            )
          )
        `)
        .eq('student_id', paymentData.student_id);

      if (enrollmentError) throw enrollmentError;
      setEnrollments(enrollmentData || []);

    } catch (error) {
      console.error('Erro ao carregar dados do pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do pagamento.',
        variant: 'destructive'
      });
      navigate('/student/payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethod = async (method: 'pix' | 'boleto' | 'cartao') => {
    if (!payment || !profile) return;

    try {
      setProcessingPayment(true);

      // Call edge function to create/update Asaas payment
      const { data, error } = await supabase.functions.invoke('create-enrollment-payment', {
        body: {
          payment_id: payment.id,
          billing_type: method.toUpperCase(),
          customer: {
            name: profile.nome_completo,
            email: profile.email,
            cpfCnpj: profile.cpf,
            phone: profile.whatsapp || profile.telefone
          }
        }
      });

      if (error) throw error;

      if (data?.invoice_url) {
        // Redirect to Asaas payment page
        window.location.href = data.invoice_url;
      }

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'pago': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'vencido': { color: 'bg-red-100 text-red-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados do pagamento...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Pagamento não encontrado</h2>
            <p className="text-muted-foreground mb-4">
              O pagamento solicitado não foi encontrado ou você não tem permissão para acessá-lo.
            </p>
            <Button onClick={() => navigate('/student/payments')}>
              Voltar para Pagamentos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/student/payments')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Finalizar Pagamento</h1>
            <p className="text-muted-foreground">Complete sua matrícula de forma segura</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Detalhes do Pagamento
                  {getStatusBadge(payment.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium">{payment.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimento</p>
                    <p className="font-medium">
                      {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="text-2xl font-bold text-primary">
                      R$ {payment.amount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{payment.status}</p>
                  </div>
                </div>

                {/* Enrolled Classes */}
                {enrollments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3">Turmas Matriculadas</h4>
                      <div className="space-y-2">
                        {enrollments.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: enrollment.classes.class_types.color }}
                            />
                            <div>
                              <p className="font-medium">{enrollment.classes.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {enrollment.classes.class_types.nome}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            {payment.status === 'pendente' && (
              <Card>
                <CardHeader>
                  <CardTitle>Escolha a forma de pagamento</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Selecione o método de pagamento de sua preferência
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* PIX */}
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5"
                      onClick={() => handlePaymentMethod('pix')}
                      disabled={processingPayment}
                    >
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <Smartphone className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">PIX</p>
                        <p className="text-xs text-muted-foreground">Instantâneo</p>
                      </div>
                    </Button>

                    {/* Boleto */}
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5"
                      onClick={() => handlePaymentMethod('boleto')}
                      disabled={processingPayment}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Boleto</p>
                        <p className="text-xs text-muted-foreground">1-2 dias úteis</p>
                      </div>
                    </Button>

                    {/* Cartão */}
                    <Button
                      variant="outline"
                      className="h-auto p-6 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5"
                      onClick={() => handlePaymentMethod('cartao')}
                      disabled={processingPayment}
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-purple-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">Cartão</p>
                        <p className="text-xs text-muted-foreground">Crédito/Débito</p>
                      </div>
                    </Button>
                  </div>

                  {processingPayment && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <p className="text-sm text-blue-800">Processando pagamento...</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Already Paid */}
            {payment.status === 'pago' && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Pagamento Confirmado!</p>
                      <p className="text-sm text-green-600">Sua matrícula foi processada com sucesso</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate('/student/dashboard')}
                    className="w-full"
                  >
                    Ir para o Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Security Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Pagamento Seguro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Criptografia SSL</p>
                    <p className="text-xs text-muted-foreground">
                      Seus dados são protegidos com criptografia de nível bancário
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Gateway Asaas</p>
                    <p className="text-xs text-muted-foreground">
                      Processamento por empresa certificada pelo Banco Central
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Confirmação Automática</p>
                    <p className="text-xs text-muted-foreground">
                      Sua matrícula é ativada automaticamente após o pagamento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Precisa de ajuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Entre em contato conosco se tiver alguma dúvida sobre o pagamento.
                </p>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Falar com Suporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}