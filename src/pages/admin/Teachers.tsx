import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  Mail,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TeacherFormModal } from '@/components/admin/forms/TeacherFormModal';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: string;
  profiles: {
    nome_completo: string;
    email: string;
    whatsapp: string;
    status: string;
  };
  especialidades: string[] | null;
  taxa_comissao: number | null;
  chave_pix: string | null;
  funcao: string;
  created_at: string;
  class_teachers?: {
    classes: {
      nome: string;
      modalidade: string;
    };
  }[];
}

const useTeachers = (searchTerm: string, modalityFilter: string) => {
  return useQuery({
    queryKey: ['teachers', searchTerm, modalityFilter],
    queryFn: async (): Promise<Teacher[]> => {
      let query = supabase
        .from('staff')
        .select(`
          id,
          especialidades,
          taxa_comissao,
          chave_pix,
          funcao,
          created_at,
          profiles!inner (
            nome_completo,
            email,
            whatsapp,
            status
          ),
          class_teachers (
            classes (
              nome,
              modalidade
            )
          )
        `)
        .eq('funcao', 'professor');

      if (searchTerm) {
        query = query.ilike('profiles.nome_completo', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('profiles(nome_completo)');

      if (error) throw error;

      let filteredData = data || [];

      // Filtrar por modalidade se especificado
      if (modalityFilter && modalityFilter !== 'all') {
        filteredData = filteredData.filter(teacher => 
          teacher.especialidades?.includes(modalityFilter)
        );
      }

      return filteredData as Teacher[];
    },
  });
};

const getModalityOptions = () => [
  'Ballet',
  'Jazz',
  'Contemporâneo',
  'Hip Hop',
  'Dança de Salão',
  'Sapateado',
  'Teatro Musical',
  'Dança do Ventre',
  'Zumba',
  'Fitness Dance'
];

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { toast } = useToast();

  const { data: teachers, isLoading, error, refetch } = useTeachers(searchTerm, modalityFilter);

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', teacherId);

      if (error) throw error;

      toast({
        title: "Professor excluído",
        description: "Professor removido com sucesso",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir professor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'ativo' ? (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">Ativo</Badge>
    ) : (
      <Badge variant="destructive">Inativo</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Professores</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Professores</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar professores</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Professores</h1>
          <p className="text-muted-foreground">
            Gerencie a equipe de professores da escola
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Professor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[180px]">
              <Select value={modalityFilter} onValueChange={setModalityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as modalidades</SelectItem>
                  {getModalityOptions().map((modality) => (
                    <SelectItem key={modality} value={modality}>
                      {modality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Professores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers?.map((teacher) => (
          <Card key={teacher.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{teacher.profiles.nome_completo}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {teacher.profiles.email}
                    </CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setSelectedTeacher(teacher);
                      setShowForm(true);
                    }}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSelectedTeacher(teacher);
                      setShowForm(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(teacher.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                {getStatusBadge(teacher.profiles.status)}
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{teacher.profiles.whatsapp}</span>
              </div>

              {/* Especialidades */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Especialidades:</p>
                <div className="flex flex-wrap gap-1">
                  {teacher.especialidades?.map((especialidade, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {especialidade}
                    </Badge>
                  )) || (
                    <span className="text-xs text-muted-foreground">Não informado</span>
                  )}
                </div>
              </div>

              {/* Comissão */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Comissão: {teacher.taxa_comissao ? `${teacher.taxa_comissao}%` : 'Não definida'}
                </span>
              </div>

              {/* Turmas */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">Turmas:</p>
                <div className="text-xs">
                  {teacher.class_teachers && teacher.class_teachers.length > 0 ? (
                    <span>{teacher.class_teachers.length} turma(s)</span>
                  ) : (
                    <span className="text-muted-foreground">Nenhuma turma atribuída</span>
                  )}
                </div>
              </div>

              {/* Data de cadastro */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Cadastrado em {new Date(teacher.created_at).toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {teachers && teachers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhum professor encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || modalityFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Adicione o primeiro professor à equipe'
                }
              </p>
            </div>
            {!searchTerm && modalityFilter === 'all' && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Professor
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      <TeacherFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onSuccess={() => {
          refetch();
          setShowForm(false);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}