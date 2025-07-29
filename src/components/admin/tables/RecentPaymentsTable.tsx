import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const useRecentPayments = () => {
  return useQuery({
    queryKey: ['recent-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          paid_date,
          due_date,
          payment_method,
          enrollments (
            students (
              profiles (
                nome_completo
              )
            ),
            classes (
              nome,
              modalidade
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });
};

export function RecentPaymentsTable() {
  const { data: payments, isLoading, error } = useRecentPayments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string | null) => {
    if (!method) return <CreditCard className="h-4 w-4" />;
    
    switch (method.toLowerCase()) {
      case 'pix':
        return <div className="text-xs font-bold text-primary">PIX</div>;
      case 'boleto':
        return <div className="text-xs">BOL</div>;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Últimos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !payments || payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Últimos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            {error ? 'Erro ao carregar dados' : 'Nenhum pagamento encontrado'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Últimos Pagamentos
        </CardTitle>
        <CardDescription>
          Os 10 pagamentos mais recentes no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.map((payment) => {
            const studentName = payment.enrollments?.students?.profiles?.nome_completo || 'N/A';
            const className = payment.enrollments?.classes?.nome || 'N/A';
            const modality = payment.enrollments?.classes?.modalidade || '';

            return (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                    {getPaymentMethodIcon(payment.payment_method)}
                  </div>
                  <div>
                    <p className="font-medium">{studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      {className} {modality && `• ${modality}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paid_date 
                        ? `Pago em ${format(new Date(payment.paid_date), 'dd/MM/yyyy', { locale: ptBR })}`
                        : `Vence em ${format(new Date(payment.due_date), 'dd/MM/yyyy', { locale: ptBR })}`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(payment.amount)}
                    </p>
                  </div>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}