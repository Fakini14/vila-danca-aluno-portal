import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, Users } from 'lucide-react';

interface StudentWithDetails {
  id: string;
  nome_completo: string;
  email: string;
  whatsapp: string;
  cpf: string;
  status: 'ativo' | 'inativo';
  sexo: 'masculino' | 'feminino' | 'outro';
  data_nascimento: string | null;
  email_confirmed: boolean;
  auth_status: 'pending' | 'active';
  enrollments_count: number;
  active_enrollments: number;
  payment_status: 'em_dia' | 'pendente' | 'vencida';
  last_payment_date: string | null;
}

export function StudentList() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      // Query students with enrollment and payment information
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles!students_id_fkey(
            nome_completo,
            email,
            whatsapp,
            cpf,
            status,
            email_confirmed
          ),
          enrollments(
            id,
            ativa,
            created_at,
            classes(
              id,
              nome,
              valor_aula
            )
          )
        `);

      if (error) throw error;

      // Process data to include calculated fields
      const processedStudents: StudentWithDetails[] = data?.map(student => {
        const activeEnrollments = student.enrollments.filter(e => e.ativa);
        
        return {
          id: student.id,
          nome_completo: student.profiles?.nome_completo || '',
          email: student.profiles?.email || '',
          whatsapp: student.profiles?.whatsapp || '',
          cpf: student.profiles?.cpf || '',
          status: student.profiles?.status || 'ativo',
          sexo: student.sexo,
          data_nascimento: student.data_nascimento,
          email_confirmed: student.profiles?.email_confirmed || false,
          auth_status: student.auth_status || 'pending',
          enrollments_count: student.enrollments.length,
          active_enrollments: activeEnrollments.length,
          payment_status: 'em_dia', // This would be calculated based on payments
          last_payment_date: null, // This would come from payments table
        };
      }) || [];

      setStudents(processedStudents);
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cpf.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || student.payment_status === paymentFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const handleViewStudent = (studentId: string) => {
    navigate(`/admin/students/${studentId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const activeStudents = students.filter(s => s.status === 'ativo').length;
  const totalEnrollments = students.reduce((sum, s) => sum + s.active_enrollments, 0);

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeStudents} ativos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              em {students.filter(s => s.active_enrollments > 0).length} alunos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Confirmação</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.length > 0 ? Math.round((students.filter(s => s.email_confirmed).length / students.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              emails confirmados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          <strong>ℹ️ Cadastro de Alunos:</strong> Os alunos devem se cadastrar diretamente através da página pública de registro. 
          Você pode apenas visualizar e editar os dados dos alunos já cadastrados.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
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
        </div>
      </div>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Aluno</th>
                  <th className="p-4 font-medium">Contato</th>
                  <th className="p-4 font-medium">Turmas</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Conta</th>
                  <th className="p-4 font-medium">Pagamento</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                        ? 'Nenhum aluno encontrado com os filtros aplicados' 
                        : 'Nenhum aluno cadastrado'
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{student.nome_completo}</p>
                          <p className="text-sm text-muted-foreground">{student.cpf}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm">{student.email}</p>
                          <p className="text-sm text-muted-foreground">{student.whatsapp}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {student.active_enrollments} ativa{student.active_enrollments !== 1 ? 's' : ''}
                          </Badge>
                          {student.enrollments_count > student.active_enrollments && (
                            <Badge variant="outline">
                              +{student.enrollments_count - student.active_enrollments} inativa{student.enrollments_count - student.active_enrollments !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'}>
                            {student.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                          <Badge variant={student.email_confirmed ? 'default' : 'outline'} className="text-xs">
                            {student.email_confirmed ? 'Email OK' : 'Email Pendente'}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={student.auth_status === 'active' ? 'default' : 'secondary'}
                        >
                          {student.auth_status === 'active' ? 'Conta Ativa' : 'Aguardando Registro'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={
                            student.payment_status === 'em_dia' ? 'default' :
                            student.payment_status === 'pendente' ? 'secondary' : 'destructive'
                          }
                        >
                          {student.payment_status === 'em_dia' ? 'Em dia' :
                           student.payment_status === 'pendente' ? 'Pendente' : 'Vencida'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}