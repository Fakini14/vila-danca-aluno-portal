import { useState, useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputCPF, InputWhatsApp, InputCEP } from '@/components/ui/masked-inputs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Music, ArrowLeft, UserPlus, LogIn } from 'lucide-react';

type AuthMode = 'main' | 'forgotPassword';

export default function Auth() {
  const { signIn, signUp, resetPassword, resendConfirmation, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('main');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'resend') {
      // Show a message or automatically switch to login mode with instructions
      setAuthMode('main');
      setActiveTab('login');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 rounded-full bg-primary/10">
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">Vila Dança & Arte</h2>
          <p className="text-muted-foreground mb-4">Verificando autenticação...</p>
          <div className="w-64 bg-secondary rounded-full h-2 mx-auto">
            <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground mt-4">
              Debug: Auth loading state - check console for details
            </p>
          )}
        </div>
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

    // All users register as 'aluno' initially
    const additionalData = {
      nome_completo, 
      cpf, 
      whatsapp,
      sexo,
      data_nascimento,
      endereco_completo,
      cep,
      role: 'aluno'
    };

    console.log('Form submission - Additional Data:', additionalData);
    console.log('Masked fields verification:', {
      cpf_clean: cpf,
      whatsapp_clean: whatsapp, 
      cep_clean: cep,
      cpf_length: cpf?.length,
      whatsapp_length: whatsapp?.length,
      cep_length: cep?.length
    });

    const { error, data } = await signUp(email, password, additionalData);
    
    if (!error && data) {
      // Clear email not confirmed state on successful signup
      setEmailNotConfirmed(null);
      // Switch to login tab after successful signup
      setActiveTab('login');
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
      setAuthMode('main');
      setActiveTab('login');
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
              <Music className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold dance-text-gradient mb-2">
            Espaço Vila Dança & Arte
          </h1>
          <p className="text-muted-foreground">
            {authMode === 'forgotPassword' ? 'Recupere sua senha' : 'Entre ou cadastre-se no sistema'}
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
                    autoComplete="email"
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
                      setAuthMode('main');
                      setEmailNotConfirmed(null);
                    }}
                  >
                    Voltar ao login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-center">
                Escolha uma opção para continuar
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
                <div className="px-6 pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Cadastrar
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="login" className="mt-0 px-6 pb-6">
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">Entrar na Conta</h3>
                      <p className="text-sm text-muted-foreground">
                        Digite suas credenciais para acessar o sistema
                      </p>
                    </div>
                    
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="seu@email.com"
                          autoComplete="email"
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
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isLoading}
                        >
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                        
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAuthMode('forgotPassword');
                              setEmailNotConfirmed(null);
                            }}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline"
                          >
                            Esqueci minha senha
                          </button>
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
                  </div>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-0 px-6 pb-6">
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-medium">Criar Nova Conta</h3>
                      <p className="text-sm text-muted-foreground">
                        Preencha seus dados para se cadastrar como aluno
                      </p>
                    </div>
                    
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-nome">Nome Completo</Label>
                          <Input
                            id="signup-nome"
                            name="nome_completo"
                            type="text"
                            required
                            placeholder="Seu nome completo"
                            autoComplete="name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-cpf">CPF</Label>
                          <InputCPF
                            id="signup-cpf"
                            name="cpf"
                            required
                            placeholder="000.000.000-00"
                            autoComplete="off"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-whatsapp">WhatsApp (Opcional)</Label>
                          <InputWhatsApp
                            id="signup-whatsapp"
                            name="whatsapp"
                            placeholder="(00) 00000-0000"
                            autoComplete="tel"
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
                            autoComplete="email"
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
                            autoComplete="new-password"
                          />
                        </div>
                        
                        {/* Additional student fields */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-sexo">Sexo (Opcional)</Label>
                          <Select name="sexo">
                            <SelectTrigger id="signup-sexo">
                              <SelectValue placeholder="Selecione o sexo (opcional)" />
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
                            autoComplete="bday"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-endereco">Endereço Completo (Opcional)</Label>
                          <Textarea
                            id="signup-endereco"
                            name="endereco_completo"
                            placeholder="Endereço completo..."
                            rows={2}
                            autoComplete="street-address"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="signup-cep">CEP (Opcional)</Label>
                          <InputCEP
                            id="signup-cep"
                            name="cep"
                            placeholder="00000-000"
                            autoComplete="postal-code"
                          />
                        </div>
                        
                        <div className="space-y-2 pt-4">
                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={isLoading}
                          >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Criando conta...' : 'Criar Conta'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}