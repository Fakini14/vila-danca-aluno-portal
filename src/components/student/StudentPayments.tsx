import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  CreditCard, 
  Calendar, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  payment_method?: string;
  description: string;
  asaas_payment_id?: string;
  asaas_invoice_url?: string;
  created_at: string;
}

interface PaymentSummary {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  paymentsThisYear: number;
}

export function StudentPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.role === 'aluno') {
      fetchPayments();
    }
  }, [profile]);

  const fetchPayments = async () => {
    if (!profile) return;

    try {
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', profile.id)
        .order('due_date', { ascending: false });

      if (error) throw error;

      setPayments(paymentsData || []);
      calculateSummary(paymentsData || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de pagamentos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (paymentsData: Payment[]) => {
    const currentYear = new Date().getFullYear();
    
    const totalPaid = paymentsData
      .filter(p => p.status === 'pago')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPending = paymentsData
      .filter(p => p.status === 'pendente')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalOverdue = paymentsData
      .filter(p => p.status === 'vencido')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const paymentsThisYear = paymentsData.filter(p => 
      new Date(p.created_at).getFullYear() === currentYear
    ).length;

    setSummary({
      totalPaid,
      totalPending,
      totalOverdue,
      paymentsThisYear
    });
  };

  const handlePayment = async (payment: Payment) => {
    if (!profile) return;

    setProcessingPayment(payment.id);
    
    try {
      // Call edge function to create Asaas payment
      const { data, error } = await supabase.functions.invoke('create-asaas-payment', {
        body: {
          student_id: profile.id,
          payment_id: payment.id,
          amount: payment.amount,
          description: payment.description,
          due_date: payment.due_date,
          customer: {
            name: profile.nome_completo,
            email: profile.email,
            cpfCnpj: profile.cpf,
            phone: profile.whatsapp
          }
        }
      });

      if (error) throw error;

      if (data?.invoiceUrl) {
        // Open payment link in new tab
        window.open(data.invoiceUrl, '_blank');
        
        toast({
          title: 'Pagamento iniciado',
          description: 'Você será redirecionado para completar o pagamento.'
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Erro no pagamento',
        description: 'Não foi possível processar o pagamento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'vencido':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pago: 'bg-green-100 text-green-800',
      pendente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800'
    };
    
    return variants[status as keyof typeof variants] || variants.cancelado;
  };

  const getPaymentMethodDisplay = (method?: string) => {
    const methods = {
      cartao: 'Cartão',
      pix: 'PIX',
      boleto: 'Boleto',
      dinheiro: 'Dinheiro'
    };
    return method ? methods[method as keyof typeof methods] || method : 'N/A';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Pagamentos</h1>
        <p className="text-muted-foreground">
          Acompanhe seu histórico de pagamentos e quite pendências.
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {summary.totalPaid.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Este ano</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                R$ {summary.totalPending.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">A pagar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencido</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {summary.totalOverdue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Em atraso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.paymentsThisYear}
              </div>
              <p className="text-xs text-muted-foreground">Este ano</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">
                Nenhum pagamento encontrado.
              </p>
              <p className="text-sm text-muted-foreground">
                Quando houver pagamentos para suas aulas, eles aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(payment.status)}
                        <h3 className="font-semibold">{payment.description}</h3>
                        <Badge className={getStatusBadge(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4" />
                          Vencimento: {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        {payment.paid_date && (
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Pago em: {format(new Date(payment.paid_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                        )}
                        {payment.payment_method && (
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {getPaymentMethodDisplay(payment.payment_method)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-primary mb-2">
                        R$ {payment.amount.toFixed(2)}
                      </p>
                      {payment.status === 'pendente' && (
                        <Button
                          onClick={() => handlePayment(payment)}
                          disabled={processingPayment === payment.id}
                          size="sm"
                        >
                          {processingPayment === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Pagar Agora
                        </Button>
                      )}
                      {payment.status === 'vencido' && (
                        <Button
                          onClick={() => handlePayment(payment)}
                          disabled={processingPayment === payment.id}
                          variant="destructive"
                          size="sm"
                        >
                          {processingPayment === payment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-2" />
                          )}
                          Quitar
                        </Button>
                      )}
                      {payment.asaas_invoice_url && payment.status !== 'pago' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(payment.asaas_invoice_url!, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Boleto
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {payment.status === 'vencido' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center text-red-800">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <p className="text-sm font-medium">
                          Pagamento em atraso desde {format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}