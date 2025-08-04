import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Search } from 'lucide-react';

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-900">
            Pagamento Cancelado
          </CardTitle>
          <CardDescription className="text-orange-700">
            O processo de matrícula foi interrompido
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2">O que aconteceu?</h4>
            <p className="text-sm text-orange-800">
              Você cancelou o processo de pagamento. Sua matrícula não foi efetivada 
              e nenhuma cobrança foi processada.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Próximos passos</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Você pode tentar se matricular novamente</li>
              <li>• Suas informações foram salvas</li>
              <li>• Entre em contato se precisar de ajuda</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/classes')} 
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Ver Turmas
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}