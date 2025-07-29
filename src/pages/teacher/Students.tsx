import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Search, 
  Phone, 
  Mail,
  BookOpen,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Eye,
  MessageCircle,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
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

interface TeacherStudent {
  id: string;
  profiles: {
    nome_completo: string;
    email: string;
    whatsapp: string;
  };
  enrollments: {
    id: string;
    ativa: boolean;
    data_matricula: string;
    classes: {
      nome: string;
      modalidade: string;
    };
  }[];
  // Mock data for attendance - seria calculado via query mais complexa
  attendance_rate?: number;
  total_classes?: number;
  present_classes?: number;
}

const useTeacherStudents = (teacherId: string, classFilter: string) => {
  return useQuery({
    queryKey: ['teacher-students', teacherId, classFilter],
    queryFn: async (): Promise<TeacherStudent[]> => {
      try {
        // Primeiro, buscar as turmas do professor
        const { data: teacherClasses, error: classError } = await supabase
          .from('class_teachers')
          .select('class_id')
          .eq('teacher_id', teacherId);

        if (classError) {
          console.error('Erro ao buscar turmas do professor:', classError);
          throw classError;
        }

        if (!teacherClasses || teacherClasses.length === 0) {
          return []; // Professor não tem turmas
        }

        const classIds = teacherClasses.map(ct => ct.class_id);

        // Buscar enrollments das turmas do professor
        let enrollmentQuery = supabase
          .from('enrollments')
          .select(`
            id,
            ativa,
            data_matricula,
            class_id,
            student_id
          `)
          .in('class_id', classIds)
          .eq('ativa', true);

        if (classFilter && classFilter !== 'all') {
          enrollmentQuery = enrollmentQuery.eq('class_id', classFilter);
        }

        const { data: enrollments, error: enrollError } = await enrollmentQuery;

        if (enrollError) {
          console.error('Erro ao buscar matrículas:', enrollError);
          throw enrollError;
        }

        if (!enrollments || enrollments.length === 0) {
          return []; // Nenhum aluno matriculado
        }

        // Buscar dados dos alunos
        const studentIds = [...new Set(enrollments.map(e => e.student_id))];
        
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            profiles (
              nome_completo,
              email,
              whatsapp
            )
          `)
          .in('id', studentIds);

        if (studentsError) {
          console.error('Erro ao buscar dados dos alunos:', studentsError);
          throw studentsError;
        }

        // Buscar dados das turmas
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select('id, nome, modalidade')
          .in('id', classIds);

        if (classesError) {
          console.error('Erro ao buscar dados das turmas:', classesError);
          throw classesError;
        }

        // Agrupar dados por aluno
        const studentsMap = new Map();

        students?.forEach(student => {
          studentsMap.set(student.id, {
            id: student.id,
            profiles: student.profiles,
            enrollments: [],
            // Mock data para demonstração
            attendance_rate: Math.floor(Math.random() * 30) + 70,
            total_classes: Math.floor(Math.random() * 20) + 10,
            present_classes: 0
          });
        });

        enrollments.forEach(enrollment => {
          const student = studentsMap.get(enrollment.student_id);
          if (student) {
            const classData = classes?.find(c => c.id === enrollment.class_id);
            if (classData) {
              student.enrollments.push({
                id: enrollment.id,
                ativa: enrollment.ativa,
                data_matricula: enrollment.data_matricula,
                classes: classData
              });
            }
          }
        });

        // Calcular present_classes baseado na attendance_rate
        studentsMap.forEach(student => {
          student.present_classes = Math.floor((student.attendance_rate / 100) * student.total_classes);
        });

        return Array.from(studentsMap.values());
      } catch (error) {
        console.error('Erro completo na query de alunos:', error);
        throw error;
      }
    },
    enabled: !!teacherId,
  });
};

const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-classes-list', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_teachers')
        .select(`
          classes!inner (
            id,
            nome,
            modalidade
          )
        `)
        .eq('teacher_id', teacherId);

      if (error) throw error;

      return data?.map(item => item.classes) || [];
    },
    enabled: !!teacherId,
  });
};

export default function TeacherStudents() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  
  const { data: students, isLoading, error } = useTeacherStudents(profile?.id || '', classFilter);
  const { data: classes } = useTeacherClasses(profile?.id || '');

  const filteredStudents = students?.filter(student =>
    student.profiles.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.profiles.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-500">Excelente</Badge>;
    if (rate >= 75) return <Badge className="bg-blue-500">Boa</Badge>;
    if (rate >= 60) return <Badge className="bg-yellow-500">Regular</Badge>;
    return <Badge variant="destructive">Baixa</Badge>;
  };

  const getAttendanceIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (rate >= 75) return <Clock className="h-4 w-4 text-blue-500" />;
    if (rate >= 60) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Meus Alunos</h1>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Meus Alunos</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar alunos</p>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Meus Alunos</h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho e frequência dos seus alunos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Resumo de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
                <p className="text-xs text-muted-foreground">Total de Alunos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((filteredStudents.reduce((acc, s) => acc + (s.attendance_rate || 0), 0) / filteredStudents.length) || 0)}%
                </p>
                <p className="text-xs text-muted-foreground">Frequência Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredStudents.filter(s => (s.attendance_rate || 0) >= 75).length}
                </p>
                <p className="text-xs text-muted-foreground">Boa Frequência</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredStudents.filter(s => (s.attendance_rate || 0) < 60).length}
                </p>
                <p className="text-xs text-muted-foreground">Necessita Atenção</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="min-w-[180px]">
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as turmas</SelectItem>
                  {classes?.map((turma) => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alunos */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(student.profiles.nome_completo)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{student.profiles.nome_completo}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {student.profiles.email}
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
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Enviar Mensagem
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Histórico de Presença
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contato */}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.profiles.whatsapp}</span>
                </div>

                {/* Turmas Matriculadas */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Turmas:</p>
                  <div className="flex flex-wrap gap-1">
                    {student.enrollments.map((enrollment) => (
                      <Badge key={enrollment.id} variant="secondary" className="text-xs">
                        {enrollment.classes.nome}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Frequência */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getAttendanceIcon(student.attendance_rate || 0)}
                    <span className="text-sm">
                      Frequência: {student.attendance_rate}%
                    </span>
                  </div>
                  {getAttendanceBadge(student.attendance_rate || 0)}
                </div>

                {/* Estatísticas de Presença */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {student.present_classes}/{student.total_classes} aulas
                  </span>
                  <span>
                    Matriculado em {new Date(student.enrollments[0]?.data_matricula).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Barra de Progresso */}
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${student.attendance_rate}%`,
                      backgroundColor: 
                        (student.attendance_rate || 0) >= 90 ? '#22c55e' :
                        (student.attendance_rate || 0) >= 75 ? '#3b82f6' :
                        (student.attendance_rate || 0) >= 60 ? '#eab308' : '#ef4444'
                    }}
                  ></div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contato
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Presença
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || classFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Você ainda não tem alunos matriculados em suas turmas.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}