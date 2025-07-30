import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ConfirmationStatus = 'loading' | 'success' | 'error' | 'expired' | 'invalid';

export default function Confirm() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        // Processar hash fragment
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const urlError = hashParams.get('error') || searchParams.get('error');
        const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

        console.log('Confirm page - URL analysis:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasError: !!urlError,
          errorDescription,
          fullHash: window.location.hash
        });

        // Se temos access_token e refresh_token, estabelecer sessão manualmente
        if (accessToken && refreshToken) {
          console.log('Found tokens in URL, setting session manually...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (!error && data.session) {
            console.log('Session established successfully:', {
              userId: data.session.user.id,
              email: data.session.user.email,
              emailConfirmed: data.session.user.email_confirmed_at
            });

            setStatus('success');
            
            toast({
              title: "Email confirmado com sucesso!",
              description: "Sua conta foi ativada. Redirecionando...",
            });

            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
            return;
          } else if (error) {
            console.error('Error setting session:', error);
          }
        }

        // Aguardar processamento automático do Supabase
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar se há uma sessão ativa
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Session check after delay:', {
          session: session ? 'present' : 'null',
          user: session?.user ? {
            id: session.user.id,
            email: session.user.email,
            emailConfirmed: session.user.email_confirmed_at
          } : 'null',
          error: sessionError
        });

        // Se há sessão e o email foi confirmado, sucesso!
        if (session?.user?.email_confirmed_at) {
          console.log('Email confirmed successfully through automatic processing!');
          setStatus('success');
          
          toast({
            title: "Email confirmado com sucesso!",
            description: "Sua conta foi ativada. Redirecionando...",
          });

          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        }

        // Verificar erros
        if (urlError) {
          console.error('Error in URL:', { urlError, errorDescription });
          
          // Ignorar server_error se temos tokens
          if (urlError === 'server_error' && (accessToken || refreshToken)) {
            console.log('Ignoring server_error as we have tokens...');
            setErrorMessage('Processando confirmação... Se o problema persistir, solicite um novo link.');
            setStatus('error');
          } else if (urlError === 'access_denied' || errorDescription?.includes('expired')) {
            setErrorMessage('Link de confirmação expirado. Solicite um novo link.');
            setStatus('expired');
          } else {
            setErrorMessage(errorDescription || 'Erro ao confirmar email');
            setStatus('error');
          }
          return;
        }

        // Se não há sessão nem erro, o link pode ser inválido
        setErrorMessage('Link de confirmação inválido ou expirado');
        setStatus('invalid');

      } catch (error: any) {
        console.error('Unexpected error during confirmation:', error);
        setErrorMessage(`Erro inesperado: ${error.message}`);
        setStatus('error');
      }
    };

    confirmUser();
  }, [searchParams, navigate, toast]);

  const resendConfirmation = () => {
    // Redirecionar para página de login com instrução para reenvio
    navigate('/auth?mode=resend');
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Confirmando seu email...</h2>
            <p className="text-muted-foreground">
              Aguarde enquanto verificamos sua confirmação
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">Email confirmado!</h2>
            <p className="text-muted-foreground mb-6">
              Sua conta foi ativada com sucesso. Você será redirecionado em instants.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Ir para o Dashboard
            </Button>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-yellow-100">
                <Mail className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-yellow-700">Link expirado</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              <Button onClick={resendConfirmation} className="w-full">
                Solicitar novo link de confirmação
              </Button>
              <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                Voltar ao login
              </Button>
            </div>
          </div>
        );

      case 'error':
      case 'invalid':
        return (
          <div className="text-center py-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-red-700">Erro na confirmação</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage}
            </p>
            <div className="space-y-3">
              {status === 'invalid' ? (
                <>
                  <Button onClick={resendConfirmation} className="w-full">
                    Solicitar novo link de confirmação
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                    Voltar ao login
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => window.location.reload()} className="w-full">
                    Tentar novamente
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/auth')} className="w-full">
                    Voltar ao login
                  </Button>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl dance-text-gradient">
              Espaço Vila Dança & Arte
            </CardTitle>
            <CardDescription>
              Confirmação de Email
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground font-mono">
              Debug - Status: {status}
              <br />
              URL: {window.location.href}
              <br />
              {errorMessage && (
                <>
                  Error: {errorMessage}
                  <br />
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}