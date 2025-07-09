import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Edit, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Student {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  cpf: string;
  status: 'ativo' | 'inativo';
  sexo: 'masculino' | 'feminino' | 'outro';
  parceiro_id?: string;
  parceiro?: {
    nome_completo: string;
  };
}

export function StudentManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles!students_id_fkey(
            nome_completo,
            email,
            whatsapp,
            cpf,
            status
          ),
          parceiro:profiles!students_parceiro_id_fkey(
            nome_completo
          )
        `);

      if (error) throw error;

      const formattedStudents = data?.map(student => ({
        id: student.id,
        nome_completo: student.profiles?.nome_completo || '',
        email: student.profiles?.email || '',
        whatsapp: student.profiles?.whatsapp || '',
        cpf: student.profiles?.cpf || '',
        status: student.profiles?.status || 'ativo',
        sexo: student.sexo,
        parceiro_id: student.parceiro_id,
        parceiro: student.parceiro
      })) || [];

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de alunos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Alunos</h2>
          <p className="text-muted-foreground">
            Gerencie os alunos cadastrados no sistema
          </p>
        </div>
        <Button className="dance-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                </p>
              </div>
            ) : (
              filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium">{student.nome_completo}</h3>
                        <p className="text-sm text-muted-foreground">
                          {student.email} • {student.whatsapp}
                        </p>
                        {student.parceiro && (
                          <p className="text-sm text-muted-foreground">
                            Parceiro: {student.parceiro.nome_completo}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'}>
                      {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do Aluno</DialogTitle>
                          <DialogDescription>
                            Informações completas do aluno
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Nome Completo</Label>
                              <p className="text-sm font-medium">{student.nome_completo}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm font-medium">{student.email}</p>
                            </div>
                            <div>
                              <Label>WhatsApp</Label>
                              <p className="text-sm font-medium">{student.whatsapp}</p>
                            </div>
                            <div>
                              <Label>CPF</Label>
                              <p className="text-sm font-medium">{student.cpf}</p>
                            </div>
                            <div>
                              <Label>Sexo</Label>
                              <p className="text-sm font-medium capitalize">{student.sexo}</p>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'}>
                                {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                          {student.parceiro && (
                            <div>
                              <Label>Parceiro</Label>
                              <p className="text-sm font-medium">{student.parceiro.nome_completo}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}