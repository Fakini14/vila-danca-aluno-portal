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
        // Primeiro, tentar pegar dos query parameters normais
        let token_hash = searchParams.get('token_hash');
        let type = searchParams.get('type');
        let error = searchParams.get('error');
        let error_description = searchParams.get('error_description');

        // Se não encontrou nos query params, verificar no hash fragment
        if (!token_hash && !type && window.location.hash) {
          console.log('No query params found, checking hash fragment...');
          
          // Processar hash fragment (removendo o # inicial)
          const hashString = window.location.hash.substring(1);
          const hashParams = new URLSearchParams(hashString);
          
          token_hash = hashParams.get('token_hash') || hashParams.get('access_token');
          type = hashParams.get('type') || 'email'; // default para email se não especificado
          error = hashParams.get('error');
          error_description = hashParams.get('error_description');

          console.log('Hash fragment parameters:', {
            hashString,
            token_hash: token_hash ? 'present' : 'missing',
            type,
            error,
            error_description
          });
        }
        
        console.log('Confirm page - Parameters received:', {
          source: token_hash ? (searchParams.get('token_hash') ? 'query' : 'hash') : 'none',
          token_hash: token_hash ? 'present' : 'missing',
          type,
          error,
          error_description,
          fullUrl: window.location.href,
          search: window.location.search,
          hash: window.location.hash
        });

        // Se há erro no parâmetro, verificar se ainda pode processar
        if (error) {
          console.error('Error in URL parameters:', { error, error_description });
          
          // Para server_error, ainda tentar processar se há token_hash
          if (error === 'server_error' && token_hash && error_description?.includes('Error confirming user')) {
            console.log('Server error but token_hash present, attempting to verify anyway...');
            // Continuar para tentar verificar o token
          } else if (error === 'access_denied') {
            setErrorMessage('Acesso negado. O link pode ter expirado.');
            setStatus('expired');
            return;
          } else {
            setErrorMessage(error_description || `Erro: ${error}`);
            setStatus('error');
            return;
          }
        }

        // Verificar se temos os parâmetros necessários
        if (!token_hash || !type) {
          console.error('Missing required parameters:', { token_hash, type });
          setErrorMessage('Parâmetros de confirmação não encontrados na URL');
          setStatus('invalid');
          return;
        }

        // Verificar se o tipo é válido
        if (type !== 'email' && type !== 'signup') {
          console.error('Invalid confirmation type:', type);
          setErrorMessage(`Tipo de confirmação inválido: ${type}`);
          setStatus('invalid');
          return;
        }

        console.log('Attempting to verify OTP with Supabase...');

        // Se temos access_token no hash, tentar usar exchangeCodeForSession
        if (token_hash && window.location.hash && window.location.hash.includes('access_token')) {
          console.log('Found access_token in hash, attempting to set session...');
          
          try {
            // Tentar usar o getSession para capturar a sessão do hash
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionData?.session && !sessionError) {
              console.log('Session found from hash:', {
                userId: sessionData.session.user.id,
                email: sessionData.session.user.email,
                emailConfirmed: sessionData.session.user.email_confirmed_at
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
            }
          } catch (hashError) {
            console.error('Error processing hash session:', hashError);
          }
        }

        // Tentar verificar o token com o Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as 'email' | 'signup'
        });

        console.log('Supabase verifyOtp response:', {
          data: data ? {
            user: data.user ? 'present' : 'null',
            session: data.session ? 'present' : 'null'
          } : 'null',
          error: error ? {
            message: error.message,
            status: error.status
          } : 'null'
        });

        if (error) {
          console.error('Supabase verification error:', error);
          
          // Tratar diferentes tipos de erro
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setErrorMessage('Link de confirmação expirado ou inválido');
            setStatus('expired');
          } else if (error.message.includes('already confirmed')) {
            setErrorMessage('Email já foi confirmado anteriormente');
            setStatus('success');
            
            // Se já foi confirmado, redirecionar após 2 segundos
            setTimeout(() => {
              navigate('/auth');
            }, 2000);
          } else {
            setErrorMessage(`Erro na verificação: ${error.message}`);
            setStatus('error');
          }
          return;
        }

        // Verificação bem-sucedida
        if (data && data.session && data.user) {
          console.log('Email confirmation successful:', {
            userId: data.user.id,
            email: data.user.email,
            emailConfirmed: data.user.email_confirmed_at
          });

          setStatus('success');
          
          toast({
            title: "Email confirmado com sucesso!",
            description: "Sua conta foi ativada. Redirecionando...",
          });

          // Redirecionar para o dashboard após 2 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          console.error('Verification succeeded but no session data returned');
          
          // Tentar verificar se o usuário já está logado
          try {
            const { data: currentSession } = await supabase.auth.getSession();
            if (currentSession?.session?.user?.email_confirmed_at) {
              console.log('User is already confirmed and logged in');
              setStatus('success');
              toast({
                title: "Email já confirmado!",
                description: "Sua conta já estava ativada. Redirecionando...",
              });
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
              return;
            }
          } catch (sessionError) {
            console.error('Error checking current session:', sessionError);
          }
          
          setErrorMessage('Confirmação processada mas sessão não foi criada. Tente fazer login.');
          setStatus('error');
        }

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
              Token Hash: {searchParams.get('token_hash') ? 'present' : 'missing'}
              <br />
              Type: {searchParams.get('type') || 'missing'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}