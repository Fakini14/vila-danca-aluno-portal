import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  Calendar,
  Search,
  UserCheck,
  FileText,
  MoreHorizontal,
  Eye,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TeacherClass {
  id: string;
  nome: string;
  modalidade: string;
  nivel: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  sala: string;
  enrollments?: {
    ativa: boolean;
    students: {
      profiles: {
        nome_completo: string;
      };
    };
  }[];
}

const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-classes', teacherId],
    queryFn: async (): Promise<TeacherClass[]> => {
      try {
        const { data, error } = await supabase
          .from('class_teachers')
          .select(`
            classes (
              id,
              nome,
              modalidade,
              nivel,
              dias_semana,
              horario_inicio,
              horario_fim,
              sala,
            )
          `)
          .eq('teacher_id', teacherId);

        if (error) {
          console.error('Erro na query teacher classes:', error);
          throw error;
        }

        // Buscar enrollments separadamente para evitar complexidade
        const classesData = data?.map(item => item.classes).filter(Boolean) || [];
        
        // Para cada turma, buscar os enrollments
        for (const turma of classesData) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('ativa')
            .eq('class_id', turma.id);
          
          turma.enrollments = enrollments || [];
        }

        return classesData as TeacherClass[];
      } catch (error) {
        console.error('Erro completo na query:', error);
        throw error;
      }
    },
    enabled: !!teacherId,
  });
};

export default function TeacherClasses() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: classes, isLoading, error } = useTeacherClasses(profile?.id || '');

  const filteredClasses = classes?.filter(turma =>
    turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    turma.modalidade.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getDayAbbreviation = (day: string) => {
    const days: Record<string, string> = {
      'segunda': 'SEG',
      'terca': 'TER', 
      'terça': 'TER',
      'quarta': 'QUA',
      'quinta': 'QUI',
      'sexta': 'SEX',
      'sabado': 'SAB',
      'sábado': 'SAB',
      'domingo': 'DOM'
    };
    return days[day.toLowerCase()] || day.toUpperCase().slice(0, 3);
  };

  const getActiveStudentsCount = (enrollments: any[]) => {
    return enrollments?.filter(e => e.ativa).length || 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Minhas Turmas</h1>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Minhas Turmas</h1>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Minhas Turmas</h1>
          <p className="text-muted-foreground">
            Gerencie suas turmas, alunos e presenças
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredClasses.length} turma{filteredClasses.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome ou modalidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Turmas */}
      {filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredClasses.map((turma) => (
            <Card key={turma.id} className="dance-shadow hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{turma.nome}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <BookOpen className="h-4 w-4" />
                      {turma.modalidade} • {turma.nivel}
                    </CardDescription>
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
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Fazer Chamada
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="mr-2 h-4 w-4" />
                        Anotações
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Horários */}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {turma.horario_inicio} - {turma.horario_fim}
                  </span>
                </div>

                {/* Dias da Semana */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {turma.dias_semana.map((dia, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getDayAbbreviation(dia)}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sala */}
                {turma.sala && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Sala {turma.sala}</span>
                  </div>
                )}

                {/* Alunos */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {getActiveStudentsCount(turma.enrollments || [])} alunos matriculados
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Capacidade: 20
                  </span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  <Button variant="default" size="sm" className="flex-1">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Fazer Chamada
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="mr-2 h-4 w-4" />
                    Ver Alunos
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
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-medium">Nenhuma turma encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Você ainda não tem turmas atribuídas. Entre em contato com o administrador.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}