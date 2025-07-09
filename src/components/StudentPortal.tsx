import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, Clock, MapPin, User, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentClass {
  id: string;
  modalidade: string;
  nivel: 'basico' | 'intermediario' | 'avancado';
  tipo: 'regular' | 'workshop' | 'particular' | 'outra';
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  data_inicio: string;
  data_termino: string | null;
  valor_aula: number;
  enrollment_date: string;
  enrollment_active: boolean;
}

interface StudentData {
  sexo: 'masculino' | 'feminino' | 'outro';
  parceiro?: {
    nome_completo: string;
    email: string;
  };
}

export function StudentPortal() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'aluno') {
      fetchStudentData();
    }
  }, [profile]);

  const fetchStudentData = async () => {
    if (!profile) return;

    try {
      // Fetch student-specific data
      const { data: studentInfo } = await supabase
        .from('students')
        .select(`
          sexo,
          parceiro:profiles!students_parceiro_id_fkey(nome_completo, email)
        `)
        .eq('id', profile.id)
        .single();

      if (studentInfo) {
        setStudentData(studentInfo);
      }

      // Fetch enrolled classes
      const { data: enrolledClasses } = await supabase
        .from('enrollments')
        .select(`
          data_matricula,
          ativa,
          class:class_id(
            id,
            modalidade,
            nivel,
            tipo,
            dias_semana,
            horario_inicio,
            horario_fim,
            data_inicio,
            data_termino,
            valor_aula
          )
        `)
        .eq('student_id', profile.id)
        .eq('ativa', true);

      if (enrolledClasses) {
        const formattedClasses = enrolledClasses
          .filter(enrollment => enrollment.class)
          .map(enrollment => ({
            ...enrollment.class,
            enrollment_date: enrollment.data_matricula,
            enrollment_active: enrollment.ativa,
          }));
        
        setClasses(formattedClasses);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getLevelBadgeColor = (nivel: string) => {
    const colors = {
      basico: 'bg-green-100 text-green-800',
      intermediario: 'bg-yellow-100 text-yellow-800',
      avancado: 'bg-red-100 text-red-800',
    };
    return colors[nivel as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeBadgeColor = (tipo: string) => {
    const colors = {
      regular: 'bg-blue-100 text-blue-800',
      workshop: 'bg-purple-100 text-purple-800',
      particular: 'bg-pink-100 text-pink-800',
      outra: 'bg-gray-100 text-gray-800',
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDaysOfWeek = (days: string[]) => {
    const dayMap = {
      domingo: 'Dom',
      segunda: 'Seg',
      terca: 'Ter',
      quarta: 'Qua',
      quinta: 'Qui',
      sexta: 'Sex',
      sabado: 'Sáb'
    };
    
    return days.map(day => dayMap[day as keyof typeof dayMap] || day).join(', ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Portal do Aluno</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {profile?.nome_completo}!
        </p>
      </div>

      {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Minhas Informações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                {profile?.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                {profile?.whatsapp}
              </div>
              {studentData?.sexo && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Sexo:</span>{' '}
                  {studentData.sexo === 'masculino' ? 'Masculino' : 
                   studentData.sexo === 'feminino' ? 'Feminino' : 'Outro'}
                </div>
              )}
              {studentData?.parceiro && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Parceiro(a):</span>{' '}
                  {studentData.parceiro.nome_completo}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {classes.length}
              </div>
              <p className="text-sm text-muted-foreground">
                {classes.length === 1 ? 'Turma Ativa' : 'Turmas Ativas'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Minhas Turmas</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você não está matriculado em nenhuma turma.
              </p>
              <p className="text-sm text-muted-foreground">
                Entre em contato com a secretaria para se matricular.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classItem) => (
                <div
                  key={classItem.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        {classItem.modalidade}
                      </h3>
                      <div className="flex gap-2 mb-2">
                        <Badge className={getLevelBadgeColor(classItem.nivel)}>
                          {classItem.nivel.charAt(0).toUpperCase() + classItem.nivel.slice(1)}
                        </Badge>
                        <Badge className={getTypeBadgeColor(classItem.tipo)}>
                          {classItem.tipo.charAt(0).toUpperCase() + classItem.tipo.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        R$ {classItem.valor_aula.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">por aula</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formatDaysOfWeek(classItem.dias_semana)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      {classItem.horario_inicio} - {classItem.horario_fim}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                      Desde {format(new Date(classItem.enrollment_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                  </div>

                  {classItem.data_inicio && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Período:</span>{' '}
                        {format(new Date(classItem.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                        {classItem.data_termino && (
                          <span>
                            {' até '}
                            {format(new Date(classItem.data_termino), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}