import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Calendar, AlertCircle, CheckCircle, XCircle, Pause, Play } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'overdue';

interface Subscription {
  id: string;
  status: SubscriptionStatus;
  billing_type: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  next_due_date: string;
  created_at: string;
  cancelled_at: string | null;
  paused_at: string | null;
  enrollments: {
    id: string;
    classes: {
      nome: string;
      horario: string;
      class_types: {
        nome: string;
        cor: string;
      };
    };
  };
  subscription_payments: {
    id: string;
    amount: number;
    due_date: string;
    paid_date: string | null;
    status: string;
    payment_method: string;
    invoice_url: string | null;
  }[];
}

export default function StudentSubscriptions() {
  const { profile } = useAuth();
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    type: 'pause' | 'cancel' | 'reactivate' | null;
    subscription: Subscription | null;
  }>({ type: null, subscription: null });

  const { data: subscriptions, isLoading, refetch } = useQuery({
    queryKey: ['student-subscriptions', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          enrollments (
            id,
            classes (
              nome,
              horario,
              class_types (
                nome,
                cor
              )
            )
          ),
          subscription_payments (
            id,
            amount,
            due_date,
            paid_date,
            status,
            payment_method,
            invoice_url
          )
        `)
        .eq('student_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!profile?.id,
  });

  const getStatusBadge = (status: SubscriptionStatus) => {
    const statusConfig = {
      active: { label: 'Ativa', variant: 'default' as const, icon: CheckCircle },
      paused: { label: 'Pausada', variant: 'secondary' as const, icon: Pause },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle },
      overdue: { label: 'Inadimplente', variant: 'destructive' as const, icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      CREDIT_CARD: 'Cartão de Crédito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
    };
    return methods[method] || method;
  };

  const handleAction = async (type: 'pause' | 'cancel' | 'reactivate', subscription: Subscription) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: {
          subscription_id: subscription.id,
          action: type
        }
      });

      if (error) throw error;

      toast.success(data.message || `Assinatura ${type === 'pause' ? 'pausada' : type === 'cancel' ? 'cancelada' : 'reativada'} com sucesso`);
      setActionDialog({ type: null, subscription: null });
      refetch();
    } catch (error) {
      console.error('Error managing subscription:', error);
      toast.error('Erro ao processar ação. Tente novamente.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Assinaturas</CardTitle>
          <CardDescription>
            Você ainda não possui nenhuma assinatura ativa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Para se matricular em uma turma e criar uma assinatura mensal,
            acesse a aba "Turmas Disponíveis".
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Minhas Assinaturas</h2>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {subscriptions.filter(s => s.status === 'active').length} ativas
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-full h-1"
                style={{ backgroundColor: subscription.enrollments.classes.class_types.cor }}
              />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {subscription.enrollments.classes.class_types.nome}
                    </CardTitle>
                    <CardDescription>
                      {subscription.enrollments.classes.nome}
                    </CardDescription>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Horário:</span>
                    <span className="font-medium">{subscription.enrollments.classes.horario}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor mensal:</span>
                    <span className="font-medium">R$ {subscription.value.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <span className="font-medium">{getPaymentMethodLabel(subscription.billing_type)}</span>
                  </div>
                  {subscription.status === 'active' && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Próx. cobrança:</span>
                      <span className="font-medium">
                        {format(new Date(subscription.next_due_date), "dd 'de' MMM", { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedSubscription(subscription)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                  
                  {subscription.status === 'active' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setActionDialog({ type: 'pause', subscription })}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive"
                        onClick={() => setActionDialog({ type: 'cancel', subscription })}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancelar
                      </Button>
                    </>
                  )}
                  
                  {subscription.status === 'paused' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setActionDialog({ type: 'reactivate', subscription })}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Reativar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de Histórico de Pagamentos */}
      <Dialog open={!!selectedSubscription} onOpenChange={() => setSelectedSubscription(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos</DialogTitle>
            <DialogDescription>
              {selectedSubscription?.enrollments.classes.class_types.nome} - {selectedSubscription?.enrollments.classes.nome}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSubscription.subscription_payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>R$ {payment.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={payment.paid_date ? 'default' : 'secondary'}>
                        {payment.paid_date ? 'Pago' : payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paid_date
                        ? format(new Date(payment.paid_date), "dd/MM/yyyy", { locale: ptBR })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.invoice_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a href={payment.invoice_url} target="_blank" rel="noopener noreferrer">
                            Ver Fatura
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Ação */}
      <Dialog 
        open={!!actionDialog.type} 
        onOpenChange={() => setActionDialog({ type: null, subscription: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'pause' && 'Pausar Assinatura'}
              {actionDialog.type === 'cancel' && 'Cancelar Assinatura'}
              {actionDialog.type === 'reactivate' && 'Reativar Assinatura'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'pause' && 
                'Sua assinatura será pausada e as cobranças serão suspensas temporariamente. Você pode reativar a qualquer momento.'}
              {actionDialog.type === 'cancel' && 
                'Atenção: Esta ação é irreversível. Sua assinatura será cancelada e você perderá o acesso às aulas.'}
              {actionDialog.type === 'reactivate' && 
                'Sua assinatura será reativada e as cobranças mensais serão retomadas.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialog({ type: null, subscription: null })}
            >
              Voltar
            </Button>
            <Button
              variant={actionDialog.type === 'cancel' ? 'destructive' : 'default'}
              onClick={() => {
                if (actionDialog.type && actionDialog.subscription) {
                  handleAction(actionDialog.type, actionDialog.subscription);
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}