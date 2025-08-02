import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  DollarSign
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column, ActionButton, StatusBadge } from '@/components/shared/DataTable';
import { useTeachers, useDeactivateTeacher } from '@/hooks/useTeachers';
import { TeacherFormModal } from '@/components/admin/forms/TeacherFormModal';

interface TeacherData {
  id: string;
  profile_id: string;
  especialidades: string[];
  taxa_comissao: number;
  chave_pix: string;
  dados_bancarios: any;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome_completo: string;
    email: string;
    role: string;
  };
  classes?: any[];
}


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
  const [modalityFilter, setModalityFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  
  const { data: teachers = [], isLoading, error } = useTeachers();
  const deactivateTeacher = useDeactivateTeacher();

  const handleViewTeacher = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleEditTeacher = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setShowForm(true);
  };

  const handleDeactivateTeacher = (teacher: TeacherData) => {
    if (confirm('Tem certeza que deseja desativar este professor?')) {
      deactivateTeacher.mutate(teacher.id);
    }
  };

  // Filter teachers by modality
  const filteredTeachers = teachers.filter(teacher => {
    if (modalityFilter === 'all') return true;
    return teacher.especialidades?.includes(modalityFilter);
  });

  // Define table columns
  const columns: Column<TeacherData>[] = [
    {
      key: 'profiles.nome_completo',
      title: 'Professor',
      render: (value, teacher) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{teacher.profiles?.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'especialidades',
      title: 'Especialidades',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.slice(0, 2).map((especialidade: string, index: number) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {especialidade}
            </Badge>
          )) || <span className="text-xs text-muted-foreground">Não informado</span>}
          {value?.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'taxa_comissao',
      title: 'Comissão',
      render: (value) => (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {value ? `${value}%` : 'Não definida'}
          </span>
        </div>
      )
    },
    {
      key: 'ativo',
      title: 'Status',
      render: (value) => (
        <StatusBadge 
          status={value ? 'Ativo' : 'Inativo'}
          variant={value ? 'default' : 'destructive'}
        />
      )
    },
    {
      key: 'classes',
      title: 'Turmas',
      render: (value) => (
        <div className="text-sm">
          {value && value.length > 0 ? (
            <span>{value.length} turma{value.length !== 1 ? 's' : ''}</span>
          ) : (
            <span className="text-muted-foreground">Nenhuma</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Cadastro',
      render: (value) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  // Define table actions
  const actions: ActionButton<TeacherData>[] = [
    {
      label: 'Visualizar',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewTeacher
    },
    {
      label: 'Editar',
      icon: <Edit className="h-4 w-4" />,
      onClick: handleEditTeacher
    },
    {
      label: 'Desativar',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeactivateTeacher,
      variant: 'destructive',
      show: (teacher) => teacher.ativo
    }
  ];

  // Calculate statistics
  const activeTeachers = teachers.filter(t => t.ativo).length;
  const totalSpecialties = new Set(teachers.flatMap(t => t.especialidades || [])).size;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Professores</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeTeachers} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Especialidades</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSpecialties}</div>
            <p className="text-xs text-muted-foreground">
              modalidades oferecidas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Comissão</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.length > 0 
                ? Math.round(teachers.reduce((acc, t) => acc + (t.taxa_comissao || 0), 0) / teachers.length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              comissão média
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table with DataTable */}
      <DataTable
        data={filteredTeachers}
        columns={columns}
        actions={actions}
        title="Lista de Professores"
        description="Gerencie a equipe de professores e suas especialidades"
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        emptyMessage="Nenhum professor cadastrado"
        renderFilters={() => (
          <Select value={modalityFilter} onValueChange={setModalityFilter}>
            <SelectTrigger className="w-48">
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
        )}
      />

      {/* Modal de Formulário */}
      <TeacherFormModal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedTeacher(null);
        }}
        teacher={selectedTeacher}
        onSuccess={() => {
          setShowForm(false);
          setSelectedTeacher(null);
        }}
      />
    </div>
  );
}