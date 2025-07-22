
import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Music, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const { updatePassword, user, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidResetFlow, setIsValidResetFlow] = useState(false);

  // Check if user came from password reset link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    console.log('Reset password URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
    
    // Check if this is a valid password reset flow
    if (type === 'recovery' || (accessToken && refreshToken)) {
      setIsValidResetFlow(true);
    } else if (type && type !== 'recovery') {
      toast({
        title: "Link inválido",
        description: "Este link de redefinição de senha não é válido ou expirou",
        variant: "destructive",
      });
    }
  }, [toast]);

  // If user is authenticated but not from reset flow, they can still change password
  useEffect(() => {
    if (user && !isValidResetFlow) {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.get('type') && !urlParams.get('access_token')) {
        setIsValidResetFlow(true); // Allow authenticated users to change password
      }
    }
  }, [user, isValidResetFlow]);

  // Redirect if not authenticated and not a valid reset flow
  if (!loading && !user && !isValidResetFlow) {
    return <Navigate to="/auth" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await updatePassword(password);
    
    if (!error) {
      setIsSuccess(true);
      toast({
        title: "Senha redefinida com sucesso",
        description: "Sua senha foi atualizada. Você será redirecionado para o dashboard",
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    }
    
    setIsLoading(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Senha Redefinida!</h2>
                <p className="text-muted-foreground mb-4">
                  Sua senha foi atualizada com sucesso. Você será redirecionado automaticamente.
                </p>
                <Button asChild>
                  <Link to="/dashboard">
                    Ir para o Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Defina sua nova senha
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
