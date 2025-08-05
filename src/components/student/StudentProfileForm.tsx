import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StudentData {
  id: string;
  sexo: 'masculino' | 'feminino' | 'outro';
  data_nascimento: string | null;
  endereco_completo: string | null;
  cep: string | null;
  email: string | null;
  whatsapp: string | null;
}

export function StudentProfileForm() {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [profileData, setProfileData] = useState({
    nome_completo: profile?.nome_completo || '',
    whatsapp: profile?.whatsapp || '',
    cpf: profile?.cpf || '',
  });

  const [formData, setFormData] = useState({
    sexo: 'outro' as 'masculino' | 'feminino' | 'outro',
    data_nascimento: '',
    endereco_completo: '',
    cep: '',
    email: profile?.email || '',
    whatsapp: '',
  });

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching student data:', error);
          return;
        }

        if (data) {
          setStudentData(data);
          setFormData({
            sexo: data.sexo || 'outro',
            data_nascimento: data.data_nascimento || '',
            endereco_completo: data.endereco_completo || '',
            cep: data.cep || '',
            email: data.email || profile?.email || '',
            whatsapp: data.whatsapp || profile?.whatsapp || '',
          });
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [user?.id, profile]);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: profileData.nome_completo,
          whatsapp: profileData.whatsapp,
          cpf: profileData.cpf,
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      toast({
        title: "Perfil atualizado",
        description: "Suas informações básicas foram atualizadas com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update or insert student data
      const { error } = await supabase
        .from('students')
        .upsert({
          id: user?.id,
          sexo: formData.sexo,
          data_nascimento: formData.data_nascimento || null,
          endereco_completo: formData.endereco_completo || null,
          cep: formData.cep || null,
          email: formData.email || null,
          whatsapp: formData.whatsapp || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Informações pessoais atualizadas",
        description: "Seus dados pessoais foram atualizados com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar informações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas (Profiles) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações Básicas
          </CardTitle>
          <CardDescription>
            Dados principais da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo</Label>
              <Input
                id="nome_completo"
                type="text"
                required
                value={profileData.nome_completo}
                onChange={(e) => handleProfileInputChange('nome_completo', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_basic">Email</Label>
              <Input
                id="email_basic"
                type="email"
                disabled
                value={profile?.email || ''}
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado pois é usado para login
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_basic">WhatsApp</Label>
              <Input
                id="whatsapp_basic"
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={profileData.whatsapp}
                onChange={(e) => handleProfileInputChange('whatsapp', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                type="text"
                required
                placeholder="000.000.000-00"
                value={profileData.cpf}
                onChange={(e) => handleProfileInputChange('cpf', e.target.value)}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Informações Básicas
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informações Pessoais Detalhadas (Students) */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais Detalhadas</CardTitle>
          <CardDescription>
            Complete seu perfil com informações adicionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select value={formData.sexo} onValueChange={(value) => handleStudentInputChange('sexo', value)}>
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
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleStudentInputChange('data_nascimento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                type="text"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => handleStudentInputChange('cep', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco_completo">Endereço Completo</Label>
              <Textarea
                id="endereco_completo"
                placeholder="Rua, número, bairro, cidade, estado"
                value={formData.endereco_completo}
                onChange={(e) => handleStudentInputChange('endereco_completo', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_student">Email (Contato)</Label>
              <Input
                id="email_student"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => handleStudentInputChange('email', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Email adicional para contato (opcional)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_student">WhatsApp (Contato)</Label>
              <Input
                id="whatsapp_student"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleStudentInputChange('whatsapp', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                WhatsApp para contato (pode ser diferente do principal)
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Salvar Informações Pessoais
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}