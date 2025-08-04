import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, Home, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EnrollmentData {
  id: string;
  classes: {
    nome: string;
    modalidade: string;
    class_types: {
      nome: string;
      cor: string;
    };
  };
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enrollmentId = searchParams.get('enrollment_id');

  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollmentData();
    } else {
      setError('ID da matrícula não encontrado');
      setLoading(false);
    }
  }, [enrollmentId]);

  const fetchEnrollmentData = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          classes (
            nome,
            modalidade,
            class_types (
              nome,
              cor
            )
          )
        `)
        .eq('id', enrollmentId)
        .eq('student_id', profile?.id)
        .single();

      if (error) throw error;

      setEnrollmentData(data);
    } catch (error) {
      console.error('Error fetching enrollment data:', error);
      setError('Erro ao carregar dados da matrícula');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
            <p className="text-center text-muted-foreground">
              Carregando informações da matrícula...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-100">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-red-900 mb-2">Erro</h1>
            <p className="text-center text-red-700 mb-6">{error}</p>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-900">
            Pagamento Confirmado!
          </CardTitle>
          <CardDescription className="text-green-700">
            Sua assinatura foi ativada com sucesso
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {enrollmentData && (
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: enrollmentData.classes.class_types.cor }}
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {enrollmentData.classes.class_types.nome}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {enrollmentData.classes.nome || enrollmentData.classes.modalidade}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-600 font-medium">Ativa</span>
                </div>
                <div className="flex justify-between">
                  <span>Próxima cobrança:</span>
                  <span className="font-medium">Todo dia 10</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">O que acontece agora?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Sua matrícula está ativa</li>
              <li>• As aulas já podem ser frequentadas</li>
              <li>• Cobrança automática todo dia 10</li>
              <li>• Acesse suas assinaturas no portal</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/subscriptions')} 
              variant="outline"
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Assinaturas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}