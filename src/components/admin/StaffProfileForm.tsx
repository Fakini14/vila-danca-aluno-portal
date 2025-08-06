import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, User, Briefcase, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function StaffProfileForm() {
  const { profile, user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Campos básicos
    nome_completo: profile?.nome_completo || '',
    whatsapp: profile?.whatsapp || '',
    cpf: profile?.cpf || '',
    email: profile?.email || '',
    
    // Campos pessoais
    data_nascimento: profile?.data_nascimento || '',
    sexo: (profile?.sexo as 'masculino' | 'feminino' | 'outro') || 'outro',
    endereco_completo: profile?.endereco_completo || '',
    cep: profile?.cep || '',
    
    // Campos profissionais
    chave_pix: profile?.chave_pix || '',
    observacoes: profile?.observacoes || '',
  });

  // Atualizar form quando profile mudar
  useEffect(() => {
    if (profile) {
      setFormData({
        nome_completo: profile.nome_completo || '',
        whatsapp: profile.whatsapp || '',
        cpf: profile.cpf || '',
        email: profile.email || '',
        data_nascimento: profile.data_nascimento || '',
        sexo: (profile.sexo as 'masculino' | 'feminino' | 'outro') || 'outro',
        endereco_completo: profile.endereco_completo || '',
        cep: profile.cep || '',
        chave_pix: profile.chave_pix || '',
        observacoes: profile.observacoes || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Preparar dados para atualização
      const updateData = {
        nome_completo: formData.nome_completo,
        whatsapp: formData.whatsapp,
        cpf: formData.cpf,
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo,
        endereco_completo: formData.endereco_completo || null,
        cep: formData.cep || null,
        chave_pix: formData.chave_pix || null,
        observacoes: formData.observacoes || null,
        updated_at: new Date().toISOString(),
      };

      // Update na tabela profiles
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id);

      if (error) throw error;

      // Atualizar contexto de auth
      await updateProfile(updateData);

      toast({
        title: "Perfil atualizado com sucesso!",
        description: "Todas as suas informações foram salvas.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro inesperado";
      toast({
        title: "Erro ao atualizar perfil",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'professor': return 'Professor';
      case 'funcionario': return 'Funcionário';
      default: return 'Usuário';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais da sua conta como {getRoleDisplayName(profile?.role || '')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input
              id="nome_completo"
              type="text"
              required
              value={formData.nome_completo}
              onChange={(e) => handleInputChange('nome_completo', e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              disabled
              value={formData.email}
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado pois é usado para login
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp *</Label>
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
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              type="text"
              required
              placeholder="000.000.000-00"
              value={formData.cpf}
              onChange={(e) => handleInputChange('cpf', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Dados pessoais adicionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => handleInputChange('data_nascimento', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <Select value={formData.sexo} onValueChange={(value) => handleInputChange('sexo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione seu sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              type="text"
              placeholder="00000-000"
              value={formData.cep}
              onChange={(e) => handleInputChange('cep', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco_completo">Endereço Completo</Label>
            <Textarea
              id="endereco_completo"
              placeholder="Rua, número, bairro, cidade, estado"
              value={formData.endereco_completo}
              onChange={(e) => handleInputChange('endereco_completo', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações Profissionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Informações Profissionais
          </CardTitle>
          <CardDescription>
            {profile?.role === 'professor' 
              ? 'Dados para recebimento de comissões e pagamentos'
              : 'Informações adicionais relacionadas ao trabalho'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chave_pix">
              Chave PIX
              {profile?.role === 'professor' && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id="chave_pix"
              type="text"
              placeholder="Digite sua chave PIX (CPF, email, telefone ou chave aleatória)"
              value={formData.chave_pix}
              onChange={(e) => handleInputChange('chave_pix', e.target.value)}
              required={profile?.role === 'professor'}
            />
            <p className="text-xs text-muted-foreground">
              {profile?.role === 'professor' 
                ? 'Necessária para recebimento das comissões das aulas'
                : 'Opcional - para recebimentos diversos'
              }
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações gerais, notas administrativas, etc."
              value={formData.observacoes}
              onChange={(e) => handleInputChange('observacoes', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão de Salvar */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
            size="lg"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Todas as Informações
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}