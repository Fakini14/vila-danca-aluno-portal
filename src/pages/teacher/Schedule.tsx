import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UserCheck,
  FileText,
  CalendarDays
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  }[];
}

interface ScheduleEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  room: string;
  students: number;
  type: 'class' | 'event';
  color: string;
}

const useTeacherClasses = (teacherId: string) => {
  return useQuery({
    queryKey: ['teacher-schedule-classes', teacherId],
    queryFn: async (): Promise<TeacherClass[]> => {
      const { data, error } = await supabase
        .from('class_teachers')
        .select(`
          classes!inner (
            id,
            nome,
            modalidade,
            nivel,
            dias_semana,
            horario_inicio,
            horario_fim,
            sala,
            enrollments (
              ativa
            )
          )
        `)
        .eq('teacher_id', teacherId);

      if (error) throw error;

      return data?.map(item => item.classes).filter(Boolean) || [];
    },
    enabled: !!teacherId,
  });
};

const getModalityColor = (modalidade: string): string => {
  const colors: Record<string, string> = {
    'Ballet': 'bg-pink-500',
    'Jazz': 'bg-purple-500',
    'Contemporâneo': 'bg-blue-500',
    'Hip Hop': 'bg-orange-500',
    'Dança de Salão': 'bg-green-500',
    'Sapateado': 'bg-yellow-600',
    'Teatro Musical': 'bg-red-500',
    'Dança do Ventre': 'bg-indigo-500',
    'Zumba': 'bg-lime-500',
    'Fitness Dance': 'bg-cyan-500'
  };
  return colors[modalidade] || 'bg-gray-500';
};

const getDayName = (dayName: string): string => {
  const days: Record<string, string> = {
    'segunda': 'segunda-feira',
    'terca': 'terça-feira',
    'terça': 'terça-feira',
    'quarta': 'quarta-feira',
    'quinta': 'quinta-feira',
    'sexta': 'sexta-feira',
    'sabado': 'sábado',
    'sábado': 'sábado',
    'domingo': 'domingo'
  };
  return days[dayName.toLowerCase()] || dayName;
};

export default function TeacherSchedule() {
  const { profile } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { data: classes, isLoading, error } = useTeacherClasses(profile?.id || '');

  // Calcular semana atual
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Converter classes para eventos da agenda
  const scheduleEvents = useMemo(() => {
    if (!classes) return [];

    const events: ScheduleEvent[] = [];

    classes.forEach(turma => {
      turma.dias_semana.forEach(dia => {
        const dayName = getDayName(dia);
        const dayIndex = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'].indexOf(dayName);
        
        if (dayIndex !== -1) {
          const targetDate = weekDays.find(d => d.getDay() === dayIndex);
          if (targetDate) {
            events.push({
              id: `${turma.id}-${dayIndex}`,
              title: turma.nome,
              time: turma.horario_inicio,
              duration: `${turma.horario_inicio} - ${turma.horario_fim}`,
              room: turma.sala || 'Não definida',
              students: turma.enrollments?.filter(e => e.ativa).length || 0,
              type: 'class',
              color: getModalityColor(turma.modalidade)
            });
          }
        }
      });
    });

    return events;
  }, [classes, weekDays]);

  // Agrupar eventos por dia
  const eventsByDay = useMemo(() => {
    const grouped: Record<string, ScheduleEvent[]> = {};
    
    weekDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      grouped[dayKey] = scheduleEvents
        .filter(event => {
          const dayName = format(day, 'EEEE', { locale: ptBR });
          const eventDayIndex = weekDays.findIndex(d => d.getDay() === (['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'].indexOf(dayName)));
          return event.id.includes(`-${day.getDay()}`);
        })
        .sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return grouped;
  }, [scheduleEvents, weekDays]);

  const nextWeek = () => setCurrentWeek(addWeeks(currentWeek, 1));
  const prevWeek = () => setCurrentWeek(subWeeks(currentWeek, 1));
  const goToToday = () => setCurrentWeek(new Date());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold dance-text-gradient">Agenda</h1>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Agenda</h1>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Erro ao carregar agenda</p>
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
          <h1 className="text-3xl font-bold dance-text-gradient">Agenda</h1>
          <p className="text-muted-foreground">
            Visualize sua agenda semanal de aulas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {scheduleEvents.length} aula{scheduleEvents.length !== 1 ? 's' : ''} esta semana
          </Badge>
        </div>
      </div>

      {/* Navegação da Semana */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                Semana de {format(weekStart, "dd/MM", { locale: ptBR })} a {format(weekEnd, "dd/MM", { locale: ptBR })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={prevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grade Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay[dayKey] || [];
          const isCurrentDay = isToday(day);

          return (
            <Card key={dayKey} className={`${isCurrentDay ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="text-center">
                  <h3 className={`font-semibold ${isCurrentDay ? 'text-primary' : ''}`}>
                    {format(day, 'EEE', { locale: ptBR }).toUpperCase()}
                  </h3>
                  <p className={`text-2xl font-bold ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                  {isCurrentDay && (
                    <Badge variant="default" className="text-xs mt-1">
                      Hoje
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayEvents.length > 0 ? (
                  dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-3 rounded-lg text-white text-sm ${event.color} cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center gap-1 text-xs opacity-90 mt-1">
                        <Clock className="h-3 w-3" />
                        {event.duration}
                      </div>
                      <div className="flex items-center justify-between text-xs opacity-90 mt-1">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.students}
                        </div>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="secondary" className="h-6 text-xs flex-1 bg-white/20 hover:bg-white/30 border-0">
                          <UserCheck className="h-3 w-3 mr-1" />
                          Chamada
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Nenhuma aula</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resumo da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Aulas desta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scheduleEvents.length > 0 ? (
                scheduleEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{event.title}</span>
                    <span className="text-muted-foreground ml-2">{event.time}</span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma aula programada
                </p>
              )}
              {scheduleEvents.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  +{scheduleEvents.length - 5} mais aulas
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total de Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {scheduleEvents.reduce((total, event) => total + event.students, 0)}
              </div>
              <p className="text-muted-foreground text-sm">
                alunos em {scheduleEvents.length} aulas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horas de Ensino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {/* Calcular horas baseado nos horários das aulas */}
                {classes?.reduce((total, turma) => {
                  const start = turma.horario_inicio.split(':');
                  const end = turma.horario_fim.split(':');
                  const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
                  const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
                  const duration = (endMinutes - startMinutes) / 60;
                  return total + (duration * turma.dias_semana.length);
                }, 0)?.toFixed(1) || '0'}h
              </div>
              <p className="text-muted-foreground text-sm">
                carga horária semanal
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Fazer Chamada
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Anotações da Aula
            </Button>
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Ver Alunos
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Ver Agenda Completa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}