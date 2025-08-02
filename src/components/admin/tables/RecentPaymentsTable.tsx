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
      // First, get payments with enrollment and student IDs
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select(`
          id,
          amount,
          status,
          paid_date,
          due_date,
          payment_method,
          enrollment_id,
          student_id
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;
      if (!paymentsData || paymentsData.length === 0) return [];

      // Get unique enrollment and student IDs
      const enrollmentIds = [...new Set(paymentsData.map(p => p.enrollment_id).filter(Boolean))];
      const studentIds = [...new Set(paymentsData.map(p => p.student_id).filter(Boolean))];

      // Fetch enrollment data with class information
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          class_id,
          student_id,
          classes (
            nome,
            modalidade
          )
        `)
        .in('id', enrollmentIds);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch student profile data
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          profiles (
            nome_completo
          )
        `)
        .in('id', studentIds);

      if (studentsError) throw studentsError;

      // Create lookup maps for efficient data joining
      const enrollmentsMap = new Map(enrollmentsData?.map(e => [e.id, e]) || []);
      const studentsMap = new Map(studentsData?.map(s => [s.id, s]) || []);

      // Combine the data
      return paymentsData.map(payment => {
        const enrollment = enrollmentsMap.get(payment.enrollment_id);
        const student = studentsMap.get(payment.student_id);
        
        return {
          ...payment,
          enrollment_data: enrollment ? {
            classes: enrollment.classes
          } : null,
          student_data: student ? {
            profiles: student.profiles
          } : null
        };
      });
    },
  });
};

export function RecentPaymentsTable() {
  const { data: payments, isLoading, error } = useRecentPayments();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pago':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'cancelado':
        return <Badge variant="outline">Cancelado</Badge>;
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
            const studentName = payment.student_data?.profiles?.nome_completo || 'N/A';
            const className = payment.enrollment_data?.classes?.nome || 'N/A';
            const modality = payment.enrollment_data?.classes?.modalidade || '';

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