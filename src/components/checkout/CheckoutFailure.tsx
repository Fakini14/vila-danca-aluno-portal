import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  MessageCircle,
  CreditCard,
  AlertTriangle,
  Home,
  PhoneCall
} from 'lucide-react';

interface PaymentData {
  id: string;
  amount: number;
  description: string;
  status: string;
  due_date: string;
}

export function CheckoutFailure() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const paymentId = searchParams.get('payment');
  const errorType = searchParams.get('error') || 'general';
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (paymentId) {
      fetchPaymentData();
    }
  }, [paymentId]);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;
      setPayment(paymentData);

    } catch (error) {
      console.error('Erro ao carregar dados do pagamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do pagamento.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    if (paymentId) {
      navigate(`/checkout/${paymentId}`);
    }
  };

  const getErrorMessage = () => {
    switch (errorType) {
      case 'timeout':
        return {
          title: 'Tempo Limite Excedido',
          message: 'O pagamento demorou mais que o esperado para ser processado.',
          suggestion: 'Tente novamente ou escolha outro método de pagamento.'
        };
      case 'declined':
        return {
          title: 'Pagamento Recusado',
          message: 'O pagamento foi recusado pela operadora.',
          suggestion: 'Verifique os dados do cartão ou tente outro método de pagamento.'
        };
      case 'insufficient_funds':
        return {
          title: 'Saldo Insuficiente',
          message: 'Não há saldo suficiente para processar o pagamento.',
          suggestion: 'Verifique seu saldo ou tente outro método de pagamento.'
        };
      case 'cancelled':
        return {
          title: 'Pagamento Cancelado',
          message: 'O pagamento foi cancelado durante o processo.',
          suggestion: 'Você pode tentar novamente a qualquer momento.'
        };
      default:
        return {
          title: 'Falha no Pagamento',
          message: 'Ocorreu um problema durante o processamento do pagamento.',
          suggestion: 'Tente novamente ou entre em contato conosco.'
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-red-800 mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-red-600 max-w-md mx-auto">
            {errorInfo.message}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Payment Details */}
          {payment && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Detalhes do Pagamento</h3>
                    <p className="text-sm text-muted-foreground">Falha no processamento</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="font-semibold">R$ {payment.amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-semibold text-right">{payment.description}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-semibold text-red-600 capitalize">{payment.status}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Suggestion Card */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-2">
                    O que fazer agora?
                  </h4>
                  <p className="text-sm text-amber-700 mb-4">
                    {errorInfo.suggestion}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={handleRetryPayment}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar Novamente
                    </Button>
                    
                    <Button variant="outline" className="border-amber-300">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Falar com Suporte
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alternative Payment Methods */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-medium mb-4">Métodos de Pagamento Alternativos</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xs font-bold text-green-600">PIX</span>
                  </div>
                  <p className="text-sm font-medium">PIX</p>
                  <p className="text-xs text-muted-foreground">Instantâneo</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xs font-bold text-blue-600">BOL</span>
                  </div>
                  <p className="text-sm font-medium">Boleto</p>
                  <p className="text-xs text-muted-foreground">1-2 dias úteis</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg hover:border-primary cursor-pointer transition-colors">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">Outro Cartão</p>
                  <p className="text-xs text-muted-foreground">Tente outro</p>
                </div>
              </div>
              
              <Button 
                onClick={handleRetryPayment}
                className="w-full mt-4"
                variant="outline"
              >
                Escolher Método de Pagamento
              </Button>
            </CardContent>
          </Card>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline"
              onClick={() => navigate('/student/dashboard')}
            >
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/student/payments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Meus Pagamentos
            </Button>
          </div>

          {/* Support Contact */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <h4 className="font-medium mb-2">Precisa de Ajuda?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Nossa equipe está pronta para ajudar você a resolver qualquer problema.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat Online
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    (11) 99999-9999
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}