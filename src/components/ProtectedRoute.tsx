import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, profile, loading, resendConfirmation } = useAuth();
  const [isResending, setIsResending] = useState(false);
  
  // Sempre mostrar loading enquanto estiver carregando
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // Se não há usuário autenticado, redirecionar para login
  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }
  
  // Check email confirmation - required for all users
  if (!user.email_confirmed_at) {
    const handleResendConfirmation = async () => {
      if (!user.email) return;
      setIsResending(true);
      await resendConfirmation(user.email);
      setIsResending(false);
    };
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Mail className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Confirme seu Email</CardTitle>
            <CardDescription>
              Você precisa confirmar seu email antes de acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                Enviamos um email de confirmação para:
              </p>
              <p className="font-medium text-foreground">
                {user.email}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Por favor, verifique sua caixa de entrada e clique no link de confirmação. 
                Não esqueça de verificar a pasta de spam também.
              </p>
              
              <Button
                onClick={handleResendConfirmation}
                disabled={isResending}
                variant="outline"
                className="w-full"
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reenviar Email de Confirmação
              </Button>
              
              <Button
                onClick={() => window.location.href = '/login'}
                variant="ghost"
                className="w-full"
              >
                Fazer Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Se o usuário não tem a role permitida
  if (!allowedRoles.includes(profile.role)) {
    // Evitar loop - não redirecionar para /dashboard se já veio de lá
    // Em vez disso, mostrar uma página de acesso negado
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-4">
            Você não tem permissão para acessar esta página.
          </p>
          <a 
            href="/dashboard" 
            className="text-primary hover:underline"
          >
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}