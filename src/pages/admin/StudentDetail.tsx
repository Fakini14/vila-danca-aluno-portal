import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { StudentDetailTabs } from '@/components/admin/students/StudentDetailTabs';

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

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      
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
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const studentDetails: StudentDetails = {
        id: data.id,
        nome_completo: data.profiles?.nome_completo || '',
        email: data.profiles?.email || '',
        whatsapp: data.profiles?.whatsapp || '',
        cpf: data.profiles?.cpf || '',
        status: data.profiles?.status || 'ativo',
        sexo: data.sexo,
        data_nascimento: data.data_nascimento,
        endereco_completo: data.endereco_completo,
        cep: data.cep,
        email_confirmed: data.profiles?.email_confirmed || false,
      };

      setStudent(studentDetails);
    } catch (error) {
      console.error('Erro ao buscar detalhes do aluno:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os detalhes do aluno',
        variant: 'destructive'
      });
      navigate('/admin/students');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/admin/students');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Aluno não encontrado</p>
        <Button variant="outline" onClick={handleBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Alunos', href: '/admin/students' },
    { label: student.nome_completo, href: `/admin/students/${student.id}` }
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">
            {student.nome_completo}
          </h1>
          <p className="text-muted-foreground">
            Detalhes completos do aluno
          </p>
        </div>
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <StudentDetailTabs student={student} onStudentUpdate={fetchStudentDetails} />
    </div>
  );
}