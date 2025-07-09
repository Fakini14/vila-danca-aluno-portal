import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Calendar, User } from 'lucide-react';

interface Enrollment {
  id: string;
  data_matricula: string;
  valor_pago_matricula?: number;
  ativa: boolean;
  student: {
    profiles: {
      nome_completo: string;
      email: string;
    };
  };
  classes: {
    modalidade: string;
    nivel: string;
    horario_inicio: string;
    horario_fim: string;
  };
}

export function EnrollmentManager() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          student:students!enrollments_student_id_fkey(
            profiles!students_id_fkey(
              nome_completo,
              email
            )
          ),
          classes!enrollments_class_id_fkey(
            modalidade,
            nivel,
            horario_inicio,
            horario_fim
          )
        `)
        .order('data_matricula', { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      console.error('Erro ao buscar matrículas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de matrículas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment =>
    enrollment.student.profiles.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.classes.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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
          <h2 className="text-2xl font-bold">Gestão de Matrículas</h2>
          <p className="text-muted-foreground">
            Gerencie as matrículas dos alunos nas turmas
          </p>
        </div>
        <Button className="dance-gradient">
          <Plus className="mr-2 h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno ou modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEnrollments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma matrícula encontrada' : 'Nenhuma matrícula cadastrada'}
                </p>
              </div>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-medium">
                          {enrollment.student.profiles.nome_completo}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.student.profiles.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground ml-8">
                      <div className="flex items-center space-x-1">
                        <span className="font-medium">Turma:</span>
                        <span>{enrollment.classes.modalidade}</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {enrollment.classes.nivel}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(enrollment.data_matricula).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span>
                          {enrollment.classes.horario_inicio} - {enrollment.classes.horario_fim}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-2 ml-8">
                      <span className="text-sm font-medium">
                        Matrícula paga: {formatCurrency(enrollment.valor_pago_matricula)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Badge variant={enrollment.ativa ? 'default' : 'secondary'}>
                      {enrollment.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
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