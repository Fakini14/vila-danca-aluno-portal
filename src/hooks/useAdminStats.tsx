import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export interface AdminStats {
  totalActiveStudents: number;
  monthRevenue: number;
  defaultRate: number;
  classesToday: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);
      
      // Total de alunos ativos
      const { count: totalActiveStudents } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('ativa', true);

      // Receita do mês (pagamentos confirmados)
      const { data: monthPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_date', startOfCurrentMonth.toISOString())
        .lte('paid_date', endOfCurrentMonth.toISOString());

      const monthRevenue = monthPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

      // Taxa de inadimplência (pagamentos vencidos não pagos)
      const { count: totalDuePayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .lt('due_date', today.toISOString());

      const { count: totalPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true });

      const defaultRate = totalPayments ? ((totalDuePayments || 0) / totalPayments) * 100 : 0;

      // Aulas hoje (baseado nos dias da semana)
      const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
      const weekDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
      const todayName = weekDays[dayOfWeek];

      const { count: classesToday } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('ativa', true)
        .contains('dias_semana', [todayName]);

      return {
        totalActiveStudents: totalActiveStudents || 0,
        monthRevenue,
        defaultRate,
        classesToday: classesToday || 0,
      };
    },
  });
};

export const useEnrollmentTrend = () => {
  return useQuery({
    queryKey: ['enrollment-trend'],
    queryFn: async () => {
      const monthsBack = 6;
      const data = [];
      
      for (let i = monthsBack - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .gte('data_matricula', monthStart.toISOString())
          .lte('data_matricula', monthEnd.toISOString());
        
        data.push({
          month: format(date, 'MMM/yy'),
          matriculas: count || 0,
        });
      }
      
      return data;
    },
  });
};

export const useRevenueByModality = () => {
  return useQuery({
    queryKey: ['revenue-by-modality'],
    queryFn: async () => {
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);

      // Buscar pagamentos do mês com as turmas associadas
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          amount,
          enrollments (
            classes (
              modalidade
            )
          )
        `)
        .eq('status', 'paid')
        .gte('paid_date', startOfCurrentMonth.toISOString())
        .lte('paid_date', endOfCurrentMonth.toISOString());

      // Agrupar por modalidade
      const revenueByModality: Record<string, number> = {};
      
      payments?.forEach((payment) => {
        const modality = payment.enrollments?.classes?.modalidade || 'Outros';
        revenueByModality[modality] = (revenueByModality[modality] || 0) + payment.amount;
      });

      return Object.entries(revenueByModality).map(([name, value]) => ({
        name,
        value,
      }));
    },
  });
};

export const useClassOccupancy = () => {
  return useQuery({
    queryKey: ['class-occupancy'],
    queryFn: async () => {
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          nome,
          capacidade_maxima,
          enrollments!inner (
            ativa
          )
        `)
        .eq('ativa', true)
        .eq('enrollments.ativa', true);

      return classes?.map((classItem) => {
        const enrolledCount = classItem.enrollments?.length || 0;
        const capacity = classItem.capacidade_maxima || 0;
        const occupancyRate = capacity > 0 ? (enrolledCount / capacity) * 100 : 0;

        return {
          name: classItem.nome,
          ocupados: enrolledCount,
          capacidade: capacity,
          ocupacao: Math.round(occupancyRate),
        };
      }) || [];
    },
  });
};