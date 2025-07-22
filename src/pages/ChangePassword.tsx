
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas são iguais",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await updatePassword(formData.newPassword);

    if (!error) {
      setFormData({
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso",
      });
    }

    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Alterar Senha</h1>
          <p className="text-muted-foreground">
            Mantenha sua conta segura com uma senha forte
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Nova Senha
            </CardTitle>
            <CardDescription>
              Digite sua nova senha e confirme para alterar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A senha deve ter pelo menos 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Lock className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
