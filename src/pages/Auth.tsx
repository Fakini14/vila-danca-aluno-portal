import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Music, ArrowLeft, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'forgotPassword';

export default function Auth() {
  const { signIn, signUp, resetPassword, resendConfirmation, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<'aluno' | 'professor'>('aluno');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState<string | null>(null);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'resend') {
      // Show a message or automatically switch to login mode with instructions
      setAuthMode('login');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    // Check if the error is about email not being confirmed
    if (error && (
      error.message.includes('Email not confirmed') || 
      error.message.includes('email_not_confirmed') ||
      error.message.includes('not confirmed')
    )) {
      setEmailNotConfirmed(email);
    } else {
      setEmailNotConfirmed(null);
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nome_completo = formData.get('nome_completo') as string;
    const cpf = formData.get('cpf') as string;
    const whatsapp = formData.get('whatsapp') as string;
    
    // Additional student fields
    const sexo = formData.get('sexo') as string;
    const data_nascimento = formData.get('data_nascimento') as string;
    const endereco_completo = formData.get('endereco_completo') as string;
    const cep = formData.get('cep') as string;

    const additionalData = userType === 'aluno' ? {
      nome_completo, 
      cpf, 
      whatsapp,
      sexo,
      data_nascimento,
      endereco_completo,
      cep,
      role: 'aluno'
    } : {
      nome_completo, 
      cpf, 
      whatsapp,
      role: 'professor'
    };

    console.log('Form submission - User Type:', userType, 'Additional Data:', additionalData);

    const { error, data } = await signUp(email, password, additionalData);
    
    if (!error && data) {
      // Clear email not confirmed state on successful signup
      setEmailNotConfirmed(null);
      setAuthMode('login');
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    const { error } = await resetPassword(email);
    if (!error) {
      setAuthMode('login');
    }
    setIsLoading(false);
  };

  const handleResendConfirmation = async (email: string) => {
    setIsLoading(true);
    const { error } = await resendConfirmation(email);
    if (!error) {
      setEmailNotConfirmed(null);
    }
    setIsLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao início
            </Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              {authMode === 'signup' ? (
                <UserPlus className="h-8 w-8 text-primary" />
              ) : (
                <Music className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold dance-text-gradient mb-2">
            Espaço Vila Dança & Arte
          </h1>
          <p className="text-muted-foreground">
            {authMode === 'login' && 'Acesse sua conta no sistema'}
            {authMode === 'signup' && 'Crie sua conta no sistema'}
            {authMode === 'forgotPassword' && 'Recupere sua senha'}
          </p>
        </div>

        {authMode === 'forgotPassword' ? (
          <Card>
            <CardHeader>
              <CardTitle>Esqueci minha senha</CardTitle>
              <CardDescription>
                Digite seu email para receber instruções de redefinição de senha
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <Input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar email de redefinição
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setAuthMode('login');
                      setEmailNotConfirmed(null);
                    }}
                  >
                    Voltar ao login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : authMode === 'signup' ? (
          <Card className="max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Criar Conta</CardTitle>
              <CardDescription>
                Preencha seus dados para se cadastrar no sistema. Professores passarão por aprovação administrativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* User Type Selection */}
                <div className="space-y-2">
                  <Label>Tipo de Usuário</Label>
                  <Select value={userType} onValueChange={(value: 'aluno' | 'professor') => setUserType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aluno">Sou Aluno</SelectItem>
                      <SelectItem value="professor">Sou Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-nome">Nome Completo</Label>
                  <Input
                    id="signup-nome"
                    name="nome_completo"
                    type="text"
                    required
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    name="cpf"
                    type="text"
                    required
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                  <Input
                    id="signup-whatsapp"
                    name="whatsapp"
                    type="text"
                    required
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>
                
                {/* Additional fields for students */}
                {userType === 'aluno' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-sexo">Sexo</Label>
                      <Select name="sexo" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o sexo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="masculino">Masculino</SelectItem>
                          <SelectItem value="feminino">Feminino</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-nascimento">Data de Nascimento (Opcional)</Label>
                      <Input
                        id="signup-nascimento"
                        name="data_nascimento"
                        type="date"
                        placeholder="DD/MM/AAAA"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-endereco">Endereço Completo (Opcional)</Label>
                      <Textarea
                        id="signup-endereco"
                        name="endereco_completo"
                        placeholder="Endereço completo..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-cep">CEP (Opcional)</Label>
                      <Input
                        id="signup-cep"
                        name="cep"
                        type="text"
                        placeholder="00000-000"
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Já tem uma conta?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setEmailNotConfirmed(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Fazer login
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Fazer Login</CardTitle>
              <CardDescription>
                Entre com suas credenciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  <div className="flex flex-col gap-2 text-center text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgotPassword');
                        setEmailNotConfirmed(null);
                      }}
                      className="text-muted-foreground hover:text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </button>
                    <div className="text-muted-foreground">
                      Não tem uma conta?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setEmailNotConfirmed(null);
                        }}
                        className="text-primary hover:underline font-medium"
                      >
                        Cadastre-se aqui
                      </button>
                    </div>
                  </div>
                  
                  {/* Email not confirmed section */}
                  {emailNotConfirmed && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-5 h-5 text-amber-600 mt-0.5">
                          ⚠️
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-amber-800 mb-1">
                            Email não confirmado
                          </h4>
                          <p className="text-sm text-amber-700 mb-3">
                            Você precisa confirmar seu email antes de fazer login. 
                            Verifique sua caixa de entrada e spam.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleResendConfirmation(emailNotConfirmed)}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reenviar email de confirmação
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}