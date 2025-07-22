
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: profile?.nome_completo || '',
    whatsapp: profile?.whatsapp || '',
    email: profile?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await updateProfile({
      nome_completo: formData.nome_completo,
      whatsapp: formData.whatsapp,
      email: formData.email,
    });

    if (!error) {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
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
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>
              Atualize seus dados cadastrais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  type="text"
                  required
                  value={formData.nome_completo}
                  onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  disabled
                  value={profile?.cpf || ''}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O CPF não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Input
                  id="role"
                  type="text"
                  disabled
                  value={profile?.role === 'admin' ? 'Administrador' : 
                        profile?.role === 'professor' ? 'Professor' :
                        profile?.role === 'funcionario' ? 'Funcionário' :
                        profile?.role === 'aluno' ? 'Aluno' : ''}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  A função não pode ser alterada
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
