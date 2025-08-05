import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  List,
  Palette,
  Eye,
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
import { DataTable, Column, ActionButton, StatusBadge } from '@/components/shared/DataTable';
import { useClassesOptimized } from '@/hooks/useOptimizedQueries';
import { ClassFormModal } from '@/components/admin/forms/ClassFormModal';
import { useToast } from '@/hooks/use-toast';


interface Teacher {
  id: string;
  profiles: {
    nome_completo: string;
  };
}

interface ClassData {
  id: string;
  nome: string | null;
  modalidade: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
  tipo: 'regular' | 'workshop' | 'particular' | 'outra';
  data_inicio: string;
  data_termino: string | null;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  tempo_total_minutos: number;
  sala: string | null;
  valor_aula: number;
  valor_matricula: number | null;
  ativa: boolean;
  professor_principal_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  professor_nome: string | null;
  // Campos calculados pela view materializada
  total_enrollments: number;
  active_enrollments: number;
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



export default function Classes() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  
  const { toast } = useToast();
  
  const { data: classes = [], isLoading, error } = useClassesOptimized();

  // Filter classes based on search and filters
  const filteredClasses = classes.filter(cls => {
    const matchesSearch = !searchTerm || 
      cls.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cls.modalidade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModality = modalityFilter === 'all' || cls.modalidade === modalityFilter;
    const matchesTeacher = teacherFilter === 'all' || cls.professor_principal_id === teacherFilter;
    const matchesDay = dayFilter === 'all' || cls.dias_semana.includes(dayFilter);
    
    return matchesSearch && matchesModality && matchesTeacher && matchesDay;
  });

  const handleViewClass = (classData: ClassData) => {
    navigate(`/admin/classes/${classData.id}`);
  };

  const handleEditClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setShowForm(true);
  };

  const handleDeleteClass = async (classData: ClassData) => {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classData.id);

      if (error) throw error;

      toast({
        title: "Turma excluída",
        description: "Turma removida com sucesso",
      });
      
      // TODO: Refresh data here - could use React Query invalidation
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

  // Define table columns for DataTable
  const columns: Column<ClassData>[] = [
    {
      key: 'nome',
      title: 'Turma',
      render: (value, classData) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">
              {value || `${classData.modalidade} - ${classData.nivel}`}
            </p>
            <p className="text-sm text-muted-foreground">{classData.modalidade}</p>
          </div>
        </div>
      )
    },
    {
      key: 'professor_nome',
      title: 'Professor',
      render: (value) => (
        <div className="text-sm">
          {value || 'Não atribuído'}
        </div>
      )
    },
    {
      key: 'dias_semana',
      title: 'Dias',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((dia: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {getDayLabel(dia)}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'horario_inicio',
      title: 'Horário',
      render: (value, classData) => (
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatTime(value)} - {formatTime(classData.horario_fim)}</span>
        </div>
      )
    },
    {
      key: 'active_enrollments',
      title: 'Alunos',
      render: (value, classData) => (
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{value || 0}</span>
        </div>
      )
    },
    {
      key: 'valor_aula',
      title: 'Valor',
      render: (value) => (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>{formatCurrency(value)}</span>
        </div>
      )
    },
    {
      key: 'ativa',
      title: 'Status',
      render: (value) => (
        <StatusBadge 
          status={value ? 'Ativa' : 'Inativa'}
          variant={value ? 'default' : 'secondary'}
        />
      )
    }
  ];

  // Define table actions
  const actions: ActionButton<ClassData>[] = [
    {
      label: 'Visualizar',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewClass
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditClass
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteClass,
      variant: 'destructive'
    }
  ];

  // Calculate statistics
  const activeClasses = classes.filter(c => c.ativa).length;
  const totalEnrollments = classes.reduce((sum, c) => sum + (c.active_enrollments || 0), 0);
  const uniqueModalities = new Set(classes.map(c => c.modalidade)).size;

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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Turmas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeClasses} ativas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              matriculados nas turmas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Modalidades</CardTitle>
            <Palette className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueModalities}</div>
            <p className="text-xs text-muted-foreground">
              modalidades oferecidas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
          {/* Header Actions for Classes */}
          <div className="flex justify-end gap-2">
            <Button onClick={() => navigate('/admin/class-types')} variant="outline" className="gap-2">
              <Palette className="h-4 w-4" />
              Modalidades
            </Button>
            <Button onClick={() => navigate('/admin/classes/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Turma
            </Button>
          </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
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
                {Array.from(new Set(classes.map(c => c.modalidade))).map((modality) => (
                  <SelectItem key={modality} value={modality}>
                    {modality}
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
                {Array.from(new Set(classes.filter(c => c.professor).map(c => ({ 
                  id: c.professor_principal_id, 
                  nome: c.professor?.profiles?.nome_completo 
                })))).map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.nome}
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
      {viewMode === 'table' ? (
        <DataTable
          data={filteredClasses}
          columns={columns}
          actions={actions}
          title="Lista de Turmas"
          description="Gerencie as turmas e horários da escola"
          searchPlaceholder="Buscar por nome ou modalidade..."
          isLoading={isLoading}
          emptyMessage="Nenhuma turma cadastrada"
          renderFilters={() => (
            <>
              <Select value={modalityFilter} onValueChange={setModalityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas modalidades</SelectItem>
                  {Array.from(new Set(classes.map(c => c.modalidade))).map((modality) => (
                    <SelectItem key={modality} value={modality}>
                      {modality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={dayFilter} onValueChange={setDayFilter}>
                <SelectTrigger className="w-40">
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
            </>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses?.map((turma) => (
            <Card key={turma.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-3 rounded-lg bg-primary/10"
                    >
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {turma.nome || `${turma.modalidade} - ${turma.nivel}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        {turma.modalidade}
                        <Badge variant="outline" className="text-xs">
                          {turma.nivel === 'basico' && 'Básico'}
                          {turma.nivel === 'intermediario' && 'Intermediário'}
                          {turma.nivel === 'avancado' && 'Avançado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditClass(turma)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClass(turma)}
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
                {turma.professor_nome && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Prof. {turma.professor_nome}</span>
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

                {/* Valor */}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{formatCurrency(turma.valor_aula)}/mês</span>
                </div>

                {/* Capacidade e Status */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{turma.active_enrollments || 0}</span>
                  </div>
                  <Badge variant={turma.ativa ? 'default' : 'secondary'}>
                    {turma.ativa ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Grid view disabled for now - only table and card views */}

      {/* Empty State */}
      {filteredClasses && filteredClasses.length === 0 && classes.length > 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
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

      </div>

      {/* Modal de Formulário para Classes */}
      <ClassFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedClass(null);
        }}
        classData={selectedClass}
        onSuccess={() => {
          setShowForm(false);
          setSelectedClass(null);
        }}
      />

    </div>
  );
}