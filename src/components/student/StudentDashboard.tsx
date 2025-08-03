import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  Bell, 
  BookOpen,
  AlertCircle,
  CheckCircle,
  Heart,
  Repeat
} from 'lucide-react';
import { format, isThisWeek, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardData {
  welcomeMessage: string;
  upcomingClasses: ClassSchedule[];
  paymentStatus: PaymentSummary;
  announcements: Announcement[];
  availableClasses: AvailableClass[];
  enrolledClasses: EnrolledClass[];
  activeSubscriptions: number;
  nextSubscriptionDue: string | null;
}

interface ClassSchedule {
  id: string;
  modalidade: string;
  dia_semana: string;
  horario_inicio: string;
  horario_fim: string;
  data: Date;
}

interface PaymentSummary {
  pendingAmount: number;
  pendingCount: number;
  nextDueDate: string | null;
  status: 'em-dia' | 'pendente' | 'vencido';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  created_at: string;
}

interface AvailableClass {
  id: string;
  modalidade: string;
  nivel: string;
  tipo: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  valor_aula: number;
}

interface EnrolledClass {
  id: string;
  modalidade: string;
  nivel: string;
  tipo: string;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  valor_aula: number;
  enrollment_date: string;
}

export function StudentDashboard() {
  const { profile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'aluno') {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile) return;

    try {
      // Fetch enrolled classes
      const { data: enrolledClasses } = await supabase
        .from('enrollments')
        .select(`
          data_matricula,
          class:class_id(
            id,
            modalidade,
            nivel,
            tipo,
            dias_semana,
            horario_inicio,
            horario_fim,
            valor_aula
          )
        `)
        .eq('student_id', profile.id)
        .eq('ativa', true);

      // Fetch payment status
      const { data: pendingPayments } = await supabase
        .from('payments')
        .select('amount, due_date, status')
        .eq('student_id', profile.id)
        .in('status', ['pendente', 'vencido']);

      // Fetch announcements
      const { data: announcements } = await supabase
        .from('announcements')
        .select('id, title, content, priority, created_at')
        .eq('published', true)
        .in('target_audience', ['all', 'students'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch available classes (not enrolled)
      const enrolledClassIds = enrolledClasses?.map(e => e.class?.id).filter(Boolean) || [];
      const { data: availableClasses } = await supabase
        .from('classes')
        .select('id, modalidade, nivel, tipo, dias_semana, horario_inicio, horario_fim, valor_aula')
        .eq('ativa', true)
        .not('id', 'in', `(${enrolledClassIds.join(',') || 'null'})`);

      // Fetch active subscriptions
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('status, next_due_date')
        .eq('student_id', profile.id)
        .eq('status', 'active');

      // Process data
      const processedEnrolledClasses = enrolledClasses?.filter(e => e.class).map(e => ({
        ...e.class!,
        enrollment_date: e.data_matricula
      })) || [];

      // Calculate upcoming classes for this week
      const upcomingClasses = generateUpcomingClasses(processedEnrolledClasses);

      // Calculate payment summary
      const paymentSummary = calculatePaymentSummary(pendingPayments || []);

      // Calculate next subscription due date
      const activeSubscriptions = subscriptions?.length || 0;
      const nextSubscriptionDue = subscriptions && subscriptions.length > 0
        ? subscriptions.sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())[0].next_due_date
        : null;

      setDashboardData({
        welcomeMessage: `Olá, ${profile.nome_completo.split(' ')[0]}! Bem-vindo ao seu portal.`,
        upcomingClasses,
        paymentStatus: paymentSummary,
        announcements: announcements || [],
        availableClasses: availableClasses || [],
        enrolledClasses: processedEnrolledClasses,
        activeSubscriptions,
        nextSubscriptionDue
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateUpcomingClasses = (classes: EnrolledClass[]): ClassSchedule[] => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 0 });
    
    const dayMap: { [key: string]: number } = {
      'domingo': 0, 'segunda': 1, 'terca': 2, 'quarta': 3,
      'quinta': 4, 'sexta': 5, 'sabado': 6
    };

    const schedule: ClassSchedule[] = [];

    classes.forEach(classItem => {
      classItem.dias_semana.forEach(dia => {
        const dayNum = dayMap[dia];
        if (dayNum !== undefined) {
          const classDate = new Date(weekStart);
          classDate.setDate(weekStart.getDate() + dayNum);
          
          if (classDate >= today && classDate <= weekEnd) {
            schedule.push({
              id: classItem.id,
              modalidade: classItem.modalidade,
              dia_semana: dia,
              horario_inicio: classItem.horario_inicio,
              horario_fim: classItem.horario_fim,
              data: classDate
            });
          }
        }
      });
    });

    return schedule.sort((a, b) => a.data.getTime() - b.data.getTime());
  };

  const calculatePaymentSummary = (payments: any[]): PaymentSummary => {
    const pending = payments.filter(p => p.status === 'pendente');
    const overdue = payments.filter(p => p.status === 'vencido');
    
    const pendingAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const nextDue = payments.length > 0 
      ? payments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0].due_date
      : null;

    let status: PaymentSummary['status'] = 'em-dia';
    if (overdue.length > 0) status = 'vencido';
    else if (pending.length > 0) status = 'pendente';

    return {
      pendingAmount,
      pendingCount: payments.length,
      nextDueDate: nextDue,
      status
    };
  };

  const formatDayOfWeek = (day: string) => {
    const dayMap: { [key: string]: string } = {
      'domingo': 'Dom', 'segunda': 'Seg', 'terca': 'Ter', 'quarta': 'Qua',
      'quinta': 'Qui', 'sexta': 'Sex', 'sabado': 'Sáb'
    };
    return dayMap[day] || day;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-blue-600',
      normal: 'text-gray-600', 
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'em-dia': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pendente': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'vencido': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return <div className="text-center py-8">Erro ao carregar dados do dashboard.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">{dashboardData.welcomeMessage}</h1>
        <p className="text-muted-foreground">
          Aqui está um resumo das suas atividades e próximas aulas.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Aulas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.upcomingClasses.length}</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.nextSubscriptionDue 
                ? `Próx: ${format(new Date(dashboardData.nextSubscriptionDue), 'dd/MM', { locale: ptBR })}`
                : 'Sem assinaturas'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Pagamento</CardTitle>
            {getPaymentStatusIcon(dashboardData.paymentStatus.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.paymentStatus.status === 'em-dia' ? 'Em dia' : 
               `R$ ${dashboardData.paymentStatus.pendingAmount.toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.paymentStatus.pendingCount > 0 
                ? `${dashboardData.paymentStatus.pendingCount} pendente(s)`
                : 'Tudo em dia'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.enrolledClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.enrolledClasses.length === 1 ? 'turma matriculada' : 'turmas matriculadas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Próximas Aulas desta Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.upcomingClasses.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma aula programada para esta semana.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboardData.upcomingClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{classItem.modalidade}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDayOfWeek(classItem.dia_semana)} - {classItem.horario_inicio} às {classItem.horario_fim}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(classItem.data, 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Comunicados Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.announcements.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum comunicado recente.
              </p>
            ) : (
              <div className="space-y-3">
                {dashboardData.announcements.map((announcement) => (
                  <div key={announcement.id} className="border-l-4 border-primary/30 pl-4">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium">{announcement.title}</h4>
                      <span className={`text-xs ${getPriorityColor(announcement.priority)}`}>
                        {announcement.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(announcement.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="mr-2 h-5 w-5" />
            Outras Aulas Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.availableClasses.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Não há outras aulas disponíveis no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboardData.availableClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{classItem.modalidade}</h3>
                    <p className="font-semibold text-primary">
                      R$ {classItem.valor_aula.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary">{classItem.nivel}</Badge>
                    <Badge variant="outline">{classItem.tipo}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center mb-1">
                      <Calendar className="mr-1 h-3 w-3" />
                      {classItem.dias_semana.map(dia => formatDayOfWeek(dia)).join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {classItem.horario_inicio} - {classItem.horario_fim}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Minhas Turmas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.enrolledClasses.length === 0 ? (
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
              {dashboardData.enrolledClasses.map((classItem) => (
                <div key={classItem.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{classItem.modalidade}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary">{classItem.nivel}</Badge>
                        <Badge variant="outline">{classItem.tipo}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">
                        R$ {classItem.valor_aula.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">por aula</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      {classItem.dias_semana.map(dia => formatDayOfWeek(dia)).join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      {classItem.horario_inicio} - {classItem.horario_fim}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Matriculado em:</span>{' '}
                      {format(new Date(classItem.enrollment_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}