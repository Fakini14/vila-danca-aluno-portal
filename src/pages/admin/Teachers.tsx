import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Phone,
  DollarSign
} from 'lucide-react';
import { DataTable, Column, ActionButton, StatusBadge } from '@/components/shared/DataTable';
import { useTeachersOptimized } from '@/hooks/useOptimizedQueries';
import { useDeactivateTeacher } from '@/hooks/useTeachers';
import { TeacherFormModal } from '@/components/admin/forms/TeacherFormModal';

interface TeacherData {
  id: string;
  nome_completo: string;
  email: string;
  role: string;
  funcao: string;
  chave_pix: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
  // Campos calculados pela view materializada
  total_classes: number;
  active_classes: number;
}



export default function Teachers() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(null);
  
  const { data: teachers = [], isLoading, error } = useTeachersOptimized();
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


  // Define table columns
  const columns: Column<TeacherData>[] = [
    {
      key: 'nome_completo',
      title: 'Professor',
      render: (value, teacher) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{teacher.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'funcao',
      title: 'Status',
      render: (value, teacher) => (
        <StatusBadge 
          status={teacher.role === 'professor' ? 'Ativo' : 'Inativo'}
          variant={teacher.role === 'professor' ? 'default' : 'destructive'}
        />
      )
    },
    {
      key: 'total_classes',
      title: 'Turmas',
      render: (value, teacher) => (
        <div className="text-sm">
          {value > 0 ? (
            <span>{value} turma{value !== 1 ? 's' : ''} ({teacher.active_classes} ativa{teacher.active_classes !== 1 ? 's' : ''})</span>
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
      show: (teacher) => teacher.role === 'professor'
    }
  ];

  // Calculate statistics
  const activeTeachers = teachers.filter(t => t.role === 'professor').length;

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Gestão de Professores</h1>
          <p className="text-muted-foreground">
            Gerencie a equipe de professores da escola
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Erro ao carregar professores</p>
        </div>
      </div>
    );
  }

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
            {isLoading ? (
              <>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{teachers.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeTeachers} ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="h-8 w-12 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{teachers.reduce((acc, t) => acc + (t.active_classes || 0), 0)}</div>
                <p className="text-xs text-muted-foreground">
                  turmas sendo ministradas
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teachers Table with DataTable */}
      <DataTable
        data={teachers}
        columns={columns}
        actions={actions}
        title="Lista de Professores"
        description="Gerencie a equipe de professores da escola"
        searchPlaceholder="Buscar por nome..."
        isLoading={isLoading}
        emptyMessage="Nenhum professor cadastrado"
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