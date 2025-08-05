import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, User, Mail, Phone, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentDetails {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  cpf: string;
  status: 'ativo' | 'inativo';
  sexo: 'masculino' | 'feminino' | 'outro';
  data_nascimento: string | null;
  endereco_completo: string | null;
  cep: string | null;
  email_confirmed: boolean;
}

interface PersonalDataTabProps {
  student: StudentDetails;
  onStudentUpdate: () => void;
}

export function PersonalDataTab({ student, onStudentUpdate }: PersonalDataTabProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: student.nome_completo,
    whatsapp: student.whatsapp,
    cpf: student.cpf,
    status: student.status,
    sexo: student.sexo,
    data_nascimento: student.data_nascimento || '',
    endereco_completo: student.endereco_completo || '',
    cep: student.cep || '',
  });
  const { toast } = useToast();

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      nome_completo: student.nome_completo,
      whatsapp: student.whatsapp,
      cpf: student.cpf,
      status: student.status,
      sexo: student.sexo,
      data_nascimento: student.data_nascimento || '',
      endereco_completo: student.endereco_completo || '',
      cep: student.cep || '',
    });
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update profile data (excluding email)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          nome_completo: formData.nome_completo,
          whatsapp: formData.whatsapp,
          cpf: formData.cpf,
          status: formData.status,
        })
        .eq('id', student.id);

      if (profileError) throw profileError;

      // Update student specific data
      const { error: studentError } = await supabase
        .from('students')
        .update({
          sexo: formData.sexo,
          data_nascimento: formData.data_nascimento || null,
          endereco_completo: formData.endereco_completo || null,
          cep: formData.cep || null,
        })
        .eq('id', student.id);

      if (studentError) throw studentError;

      toast({
        title: 'Sucesso',
        description: 'Dados do aluno atualizados com sucesso',
      });

      setEditing(false);
      onStudentUpdate();
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados do aluno',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Não informado';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        {editing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading} className="dance-gradient">
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        ) : (
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Básicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nome_completo">Nome Completo</Label>
                {editing ? (
                  <Input
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{student.nome_completo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="cpf">CPF</Label>
                {editing ? (
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{student.cpf}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sexo">Sexo</Label>
                {editing ? (
                  <Select value={formData.sexo} onValueChange={(value: 'masculino' | 'feminino' | 'outro') => setFormData({ ...formData, sexo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o sexo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm font-medium mt-1 capitalize">{student.sexo}</p>
                )}
              </div>

              <div>
                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                {editing ? (
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-medium mt-1">{formatDate(student.data_nascimento)}</p>
                )}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                {editing ? (
                  <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'}>
                      {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant={student.email_confirmed ? 'default' : 'outline'}>
                      {student.email_confirmed ? 'Email Confirmado' : 'Email Pendente'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="mt-1">
                <p className="text-sm font-medium">{student.email}</p>
                <p className="text-xs text-muted-foreground">
                  Email não pode ser alterado (vinculado à conta de login)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              {editing ? (
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              ) : (
                <p className="text-sm font-medium mt-1">{student.whatsapp}</p>
              )}
            </div>

            <div>
              <Label htmlFor="endereco_completo">Endereço</Label>
              {editing ? (
                <Textarea
                  id="endereco_completo"
                  value={formData.endereco_completo}
                  onChange={(e) => setFormData({ ...formData, endereco_completo: e.target.value })}
                  placeholder="Endereço completo..."
                />
              ) : (
                <p className="text-sm font-medium mt-1">
                  {student.endereco_completo || 'Não informado'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="cep">CEP</Label>
              {editing ? (
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              ) : (
                <p className="text-sm font-medium mt-1">
                  {student.cep || 'Não informado'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}