import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Users,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Grid3X3,
  List
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
import { ClassFormModal } from '@/components/admin/forms/ClassFormModal';
import { useToast } from '@/hooks/use-toast';
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

interface ClassType {
  id: string;
  name: string;
  color: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
}

interface Teacher {
  id: string;
  profiles: {
    nome_completo: string;
  };
}

interface Class {
  id: string;
  nome: string | null;
  modalidade: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  sala: string | null;
  capacidade_maxima: number | null;
  valor_aula: number;
  valor_matricula: number | null;
  ativa: boolean;
  professor_principal_id: string | null;
  created_at: string;
  tipo: 'regular' | 'workshop' | 'particular' | 'outra';
  professor?: Teacher;
  class_type?: ClassType;
  _count?: {
    enrollments: number;
  };
}

const diasSemana = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca', label: 'Terça' },
  { value: 'quarta', label: 'Quarta' },
  { value: 'quinta', label: 'Quinta' },
  { value: 'sexta', label: 'Sexta' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

const useClasses = (searchTerm: string, modalityFilter: string, teacherFilter: string, dayFilter: string) => {
  return useQuery({
    queryKey: ['classes', searchTerm, modalityFilter, teacherFilter, dayFilter],
    queryFn: async (): Promise<Class[]> => {
      // Fetch classes with related data
      let query = supabase
        .from('classes')
        .select(`
          *,
          professor:staff!classes_professor_principal_id_fkey(
            id,
            profiles!staff_id_fkey(
              nome_completo
            )
          ),
          enrollments(count)
        `)
        .order('horario_inicio');

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,modalidade.ilike.%${searchTerm}%`);
      }

      if (modalityFilter && modalityFilter !== 'all') {
        query = query.eq('modalidade', modalityFilter);
      }

      if (teacherFilter && teacherFilter !== 'all') {
        query = query.eq('professor_principal_id', teacherFilter);
      }

      const { data: classesData, error: classesError } = await query;

      if (classesError) throw classesError;

      // Fetch class types separately
      const { data: classTypes, error: typesError } = await supabase
        .from('class_types')
        .select('*');

      if (typesError) throw typesError;

      // Map class types by name for easy lookup
      const classTypeMap = classTypes.reduce((acc: Record<string, ClassType>, type) => {
        acc[type.name] = type;
        return acc;
      }, {});

      // Combine data and filter by day if needed
      let combinedData = (classesData || []).map((cls: any) => ({
        ...cls,
        class_type: classTypeMap[cls.modalidade],
        _count: {
          enrollments: cls.enrollments?.[0]?.count || 0
        }
      }));

      // Filter by day
      if (dayFilter && dayFilter !== 'all') {
        combinedData = combinedData.filter((cls: Class) => 
          cls.dias_semana.includes(dayFilter)
        );
      }

      return combinedData;
    },
  });
};

const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          profiles!inner(
            nome_completo
          )
        `)
        .eq('funcao', 'professor')
        .order('profiles(nome_completo)');

      if (error) throw error;
      return data || [];
    },
  });
};

const useClassTypes = () => {
  return useQuery({
    queryKey: ['class-types-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

export default function Classes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { toast } = useToast();

  const { data: classes, isLoading, error, refetch } = useClasses(searchTerm, modalityFilter, teacherFilter, dayFilter);
  const { data: teachers } = useTeachers();
  const { data: classTypes } = useClassTypes();

  const handleDelete = async (classId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      toast({
        title: "Turma excluída",
        description: "Turma removida com sucesso",
      });
      
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir turma",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getDayLabel = (day: string) => {
    return diasSemana.find(d => d.value === day)?.label || day;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Turmas</h1>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Turmas</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar turmas</p>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Turmas</h1>
          <p className="text-muted-foreground">
            Gerencie as turmas e horários da escola
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/classes/new')} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Turma
          </Button>
          <Button onClick={() => setShowForm(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Rápido
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar turma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={modalityFilter} onValueChange={setModalityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas modalidades</SelectItem>
                {classTypes?.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos professores</SelectItem>
                {teachers?.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.profiles.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dias</SelectItem>
                {diasSemana.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Turmas */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes?.map((turma) => (
            <Card key={turma.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: turma.class_type?.color ? turma.class_type.color + '20' : '#6366F120' }}
                    >
                      <BookOpen className="h-6 w-6" style={{ color: turma.class_type?.color || '#6366F1' }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {turma.nome || `${turma.modalidade} - ${turma.nivel}`}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        {turma.modalidade}
                        <Badge variant="outline" className="text-xs">
                          {turma.nivel === 'basico' && 'Básico'}
                          {turma.nivel === 'intermediario' && 'Intermediário'}
                          {turma.nivel === 'avancado' && 'Avançado'}
                        </Badge>
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
                        setSelectedClass(turma);
                        setShowForm(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(turma.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Professor */}
                {turma.professor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Prof. {turma.professor.profiles.nome_completo}</span>
                  </div>
                )}

                {/* Horário */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatTime(turma.horario_inicio)} - {formatTime(turma.horario_fim)}</span>
                </div>

                {/* Dias da semana */}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {turma.dias_semana.map((dia, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {getDayLabel(dia)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sala */}
                {turma.sala && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{turma.sala}</span>
                  </div>
                )}

                {/* Valor */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(turma.valor_aula)}/mês</span>
                </div>

                {/* Capacidade e Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{turma._count?.enrollments || 0}/{turma.capacidade_maxima || '∞'}</span>
                  </div>
                  <Badge variant={turma.ativa ? 'default' : 'secondary'}>
                    {turma.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Grade semanal em desenvolvimento...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {classes && classes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || modalityFilter !== 'all' || teacherFilter !== 'all' || dayFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie a primeira turma da escola'
                }
              </p>
            </div>
            {!searchTerm && modalityFilter === 'all' && teacherFilter === 'all' && dayFilter === 'all' && (
              <Button onClick={() => navigate('/admin/classes/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Turma
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Formulário */}
      <ClassFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedClass(null);
        }}
        classData={selectedClass}
        onSuccess={() => {
          refetch();
          setShowForm(false);
          setSelectedClass(null);
        }}
      />
    </div>
  );
}