import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Eye, UserCheck, UserX } from 'lucide-react';
import { DataTable, Column, ActionButton, StatusBadge } from '@/components/shared/DataTable';
import { useStudentsOptimized } from '@/hooks/useOptimizedQueries';
import { useUpdateStudentStatus } from '@/hooks/useStudents';

interface StudentData {
  id: string;
  nome_completo: string;
  email: string;
  role: string;
  sexo: string;
  data_nascimento: string;
  endereco_completo: string;
  responsavel_nome: string;
  responsavel_telefone: string;
  responsavel_email: string;
  auth_status: 'pending' | 'active';
  created_at: string;
  updated_at: string;
  // Campos calculados pela view materializada
  active_enrollments: number;
  total_enrollments: number;
}

export function StudentList() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const navigate = useNavigate();
  const { data: students = [], isLoading, error } = useStudentsOptimized();
  const updateStudentStatus = useUpdateStudentStatus();

  // Os dados já vêm processados da view materializada - não precisamos de processamento adicional
  const processedStudents = students.map(student => ({
    ...student,
    // A view já inclui os campos active_enrollments e total_enrollments calculados
    email: student.email || '',
  }));

  // Filter data based on status and payment filters
  const filteredStudents = processedStudents.filter(student => {
    const matchesStatus = statusFilter === 'all' || student.auth_status === statusFilter;
    const matchesPayment = paymentFilter === 'all'; // TODO: implement payment filter
    
    return matchesStatus && matchesPayment;
  });

  const handleViewStudent = (student: StudentData) => {
    navigate(`/admin/students/${student.id}`);
  };

  const handleApproveStudent = (student: StudentData) => {
    updateStudentStatus.mutate({ id: student.id, status: 'approved' });
  };

  const handleRejectStudent = (student: StudentData) => {
    updateStudentStatus.mutate({ id: student.id, status: 'rejected' });
  };

  // Define table columns
  const columns: Column<StudentData>[] = [
    {
      key: 'nome_completo',
      title: 'Aluno',
      render: (value, student) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{student.email}</p>
        </div>
      )
    },
    {
      key: 'responsavel_nome',
      title: 'Responsável',
      render: (value, student) => (
        <div>
          <p className="text-sm">{value || 'Não informado'}</p>
          <p className="text-sm text-muted-foreground">{student.responsavel_telefone || ''}</p>
        </div>
      )
    },
    {
      key: 'active_enrollments',
      title: 'Turmas',
      render: (value, student) => (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {value} ativa{value !== 1 ? 's' : ''}
          </Badge>
          {student.total_enrollments > value && (
            <Badge variant="outline">
              +{student.total_enrollments - value} inativa{student.total_enrollments - value !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'auth_status',
      title: 'Status',
      render: (value) => (
        <StatusBadge 
          status={value === 'active' ? 'Ativo' : 'Pendente'}
          variant={value === 'active' ? 'default' : 'secondary'}
        />
      )
    },
    {
      key: 'created_at',
      title: 'Data de Cadastro',
      render: (value) => new Date(value).toLocaleDateString('pt-BR')
    }
  ];

  // Define table actions
  const actions: ActionButton<StudentData>[] = [
    {
      label: 'Visualizar',
      icon: <Eye className="h-4 w-4" />,
      onClick: handleViewStudent
    },
    {
      label: 'Aprovar',
      icon: <UserCheck className="h-4 w-4" />,
      onClick: handleApproveStudent,
      show: (student) => student.auth_status === 'pending'
    },
    {
      label: 'Rejeitar',
      icon: <UserX className="h-4 w-4" />,
      onClick: handleRejectStudent,
      variant: 'destructive',
      show: (student) => student.auth_status === 'pending'
    }
  ];

  const activeStudents = processedStudents.filter(s => s.auth_status === 'active').length;
  const totalEnrollments = processedStudents.reduce((sum, s) => sum + s.active_enrollments, 0);
  const pendingStudents = processedStudents.filter(s => s.auth_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{processedStudents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeStudents} ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-28 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingStudents}</div>
                <p className="text-xs text-muted-foreground">
                  cadastros pendentes
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalEnrollments}</div>
                <p className="text-xs text-muted-foreground">
                  em {processedStudents.filter(s => s.active_enrollments > 0).length} alunos
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Aprovação</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <div className="h-8 w-14 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-20 bg-muted animate-pulse rounded mt-1"></div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {processedStudents.length > 0 ? Math.round((activeStudents / processedStudents.length) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  alunos ativos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Cadastro de Alunos:</strong> Os alunos se cadastram através da página pública. 
          Você pode visualizar, aprovar ou rejeitar os cadastros aqui.
        </p>
      </div>

      {/* Students Table with DataTable */}
      <DataTable
        data={filteredStudents}
        columns={columns}
        actions={actions}
        title="Lista de Alunos"
        description="Gerencie os alunos cadastrados no sistema"
        searchPlaceholder="Buscar por nome, email ou CPF..."
        isLoading={isLoading}
        emptyMessage="Nenhum aluno cadastrado"
        renderFilters={() => (
          <>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="em_dia">Em dia</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencida">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      />
    </div>
  );
}