import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, Calendar, CreditCard, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: string;
  payment_method: string | null;
  description: string | null;
  enrollment: {
    id: string;
    class: {
      id: string;
      nome: string;
      valor_mensal: number;
      class_type: {
        nome: string;
        color: string;
      };
    };
  };
}

interface FinanceTabProps {
  studentId: string;
}

export function FinanceTab({ studentId }: FinanceTabProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, [studentId]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          enrollments!payments_enrollment_id_fkey(
            id,
            classes!enrollments_class_id_fkey(
              id,
              nome,
              valor_mensal,
              class_types(
                nome,
                color
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });

      if (error) throw error;

      const processedPayments: Payment[] = data?.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        paid_date: payment.paid_date,
        status: payment.status,
        payment_method: payment.payment_method,
        description: payment.description,
        enrollment: {
          id: payment.enrollments?.id || '',
          class: {
            id: payment.enrollments?.classes?.id || '',
            nome: payment.enrollments?.classes?.nome || '',
            valor_mensal: payment.enrollments?.classes?.valor_mensal || 0,
            class_type: {
              nome: payment.enrollments?.classes?.class_types?.nome || '',
              color: payment.enrollments?.classes?.class_types?.color || '#6366f1',
            },
          },
        },
      })) || [];

      setPayments(processedPayments);
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados financeiros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'manual'
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Pagamento registrado com sucesso',
      });

      fetchPayments();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível registrar o pagamento',
        variant: 'destructive'
      });
    }
  };

  const handleGenerateCharge = async (paymentId: string) => {
    try {
      // This would integrate with payment gateway (ASAAS)
      toast({
        title: 'Funcionalidade em desenvolvimento',
        description: 'Integração com gateway de pagamento será implementada em breve',
      });
    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar a cobrança',
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    const matchesMonth = filterMonth === 'all' || format(new Date(payment.due_date), 'yyyy-MM') === filterMonth;
    return matchesStatus && matchesMonth;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate statistics
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = payments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid + totalPending + totalOverdue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            {Array.from({ length: 12 }, (_, i) => {
              const date = subMonths(new Date(), i);
              const value = format(date, 'yyyy-MM');
              const label = format(date, 'MMMM yyyy', { locale: ptBR });
              return (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="overdue">Vencido</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPayments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {filterMonth !== 'all' || filterStatus !== 'all' 
                ? 'Nenhum pagamento encontrado com os filtros aplicados'
                : 'Nenhum pagamento encontrado'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Turma</th>
                    <th className="p-4 font-medium">Valor</th>
                    <th className="p-4 font-medium">Vencimento</th>
                    <th className="p-4 font-medium">Pagamento</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Método</th>
                    <th className="p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: payment.enrollment.class.class_type.color }}
                          />
                          <div>
                            <p className="font-medium">{payment.enrollment.class.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.enrollment.class.class_type.nome}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(payment.due_date)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span>{formatDate(payment.paid_date)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusVariant(payment.status)}>
                            {getStatusLabel(payment.status)}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="capitalize">
                          {payment.payment_method || '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {payment.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment.id)}
                              >
                                Marcar como Pago
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateCharge(payment.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {payment.status === 'overdue' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(payment.id)}
                              >
                                Marcar como Pago
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateCharge(payment.id)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Observations */}
      {filteredPayments.some(p => p.description) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments
                .filter(p => p.description)
                .map((payment) => (
                  <div key={payment.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: payment.enrollment.class.class_type.color }}
                      />
                      <span className="text-sm font-medium">
                        {payment.enrollment.class.nome} - {formatDate(payment.due_date)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{payment.description}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}