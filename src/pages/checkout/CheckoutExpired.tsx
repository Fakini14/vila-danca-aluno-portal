import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Search } from 'lucide-react';

export default function CheckoutExpired() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-gray-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Link Expirado
          </CardTitle>
          <CardDescription className="text-gray-700">
            O tempo para realizar o pagamento expirou
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">O que aconteceu?</h4>
            <p className="text-sm text-gray-800">
              O link de pagamento expirou por questões de segurança. 
              Nenhuma cobrança foi processada.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">Como prosseguir?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Inicie o processo de matrícula novamente</li>
              <li>• Um novo link será gerado</li>
              <li>• Suas informações estão salvas</li>
              <li>• O processo é rápido e seguro</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/classes')} 
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="flex-1"
            >
              <Search className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}