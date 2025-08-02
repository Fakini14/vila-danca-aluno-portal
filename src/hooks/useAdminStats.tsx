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
      console.log('🔄 Iniciando busca de estatísticas admin...');
      
      try {
        const today = new Date();
        const startOfCurrentMonth = startOfMonth(today);
        const endOfCurrentMonth = endOfMonth(today);
        
        let totalActiveStudents = 0;
        let monthRevenue = 0;
        let defaultRate = 0;
        let classesToday = 0;

        // Total de alunos ativos - com tratamento de erro
        try {
          console.log('📊 Buscando total de alunos ativos...');
          const { count, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('ativa', true);

          if (enrollmentError) {
            console.error('❌ Erro ao buscar enrollments:', enrollmentError);
          } else {
            totalActiveStudents = count || 0;
            console.log('✅ Total de alunos ativos:', totalActiveStudents);
          }
        } catch (error) {
          console.error('❌ Erro capturado ao buscar enrollments:', error);
        }

        // Receita do mês - com tratamento de erro
        try {
          console.log('💰 Buscando receita do mês...');
          const { data: monthPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('amount')
            .eq('status', 'pago')
            .gte('paid_date', format(startOfCurrentMonth, 'yyyy-MM-dd'))
            .lte('paid_date', format(endOfCurrentMonth, 'yyyy-MM-dd'));

          if (paymentsError) {
            console.error('❌ Erro ao buscar payments:', paymentsError);
          } else {
            monthRevenue = monthPayments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
            console.log('✅ Receita do mês:', monthRevenue);
          }
        } catch (error) {
          console.error('❌ Erro capturado ao buscar payments:', error);
        }

        // Taxa de inadimplência - com tratamento de erro
        try {
          console.log('⚠️ Calculando taxa de inadimplência...');
          const { count: totalDuePayments, error: dueError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pendente')
            .lt('due_date', format(today, 'yyyy-MM-dd'));

          const { count: totalPayments, error: totalError } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true });

          if (dueError || totalError) {
            console.error('❌ Erro ao calcular inadimplência:', { dueError, totalError });
          } else {
            defaultRate = totalPayments ? ((totalDuePayments || 0) / totalPayments) * 100 : 0;
            console.log('✅ Taxa de inadimplência:', defaultRate);
          }
        } catch (error) {
          console.error('❌ Erro capturado ao calcular inadimplência:', error);
        }

        // Aulas hoje - com tratamento de erro
        try {
          console.log('📚 Buscando aulas de hoje...');
          const dayOfWeek = today.getDay();
          const weekDays = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
          const todayName = weekDays[dayOfWeek];

          const { count, error: classesError } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('ativa', true)
            .contains('dias_semana', [todayName]);

          if (classesError) {
            console.error('❌ Erro ao buscar classes:', classesError);
          } else {
            classesToday = count || 0;
            console.log('✅ Aulas hoje:', classesToday);
          }
        } catch (error) {
          console.error('❌ Erro capturado ao buscar classes:', error);
        }

        const result = {
          totalActiveStudents,
          monthRevenue,
          defaultRate,
          classesToday,
        };

        console.log('✅ Estatísticas finais:', result);
        return result;

      } catch (error) {
        console.error('❌ Erro geral ao buscar estatísticas:', error);
        // Retornar valores padrão em caso de erro
        return {
          totalActiveStudents: 0,
          monthRevenue: 0,
          defaultRate: 0,
          classesToday: 0,
        };
      }
    },
    retry: 1,
    retryDelay: 1000,
  });
};

export const useEnrollmentTrend = () => {
  return useQuery({
    queryKey: ['enrollment-trend'],
    queryFn: async () => {
      console.log('📈 Iniciando busca de tendência de matrículas...');
      
      try {
        const monthsBack = 6;
        const data = [];
        
        for (let i = monthsBack - 1; i >= 0; i--) {
          try {
            const date = subMonths(new Date(), i);
            const monthStart = startOfMonth(date);
            const monthEnd = endOfMonth(date);
            
            const { count, error } = await supabase
              .from('enrollments')
              .select('*', { count: 'exact', head: true })
              .gte('data_matricula', monthStart.toISOString())
              .lte('data_matricula', monthEnd.toISOString());
            
            if (error) {
              console.error(`❌ Erro ao buscar matrículas do mês ${format(date, 'MMM/yy')}:`, error);
            }
            
            data.push({
              month: format(date, 'MMM/yy'),
              matriculas: count || 0,
            });
          } catch (error) {
            console.error(`❌ Erro capturado no mês ${i}:`, error);
            data.push({
              month: format(subMonths(new Date(), i), 'MMM/yy'),
              matriculas: 0,
            });
          }
        }
        
        console.log('✅ Dados de tendência:', data);
        return data;
      } catch (error) {
        console.error('❌ Erro geral na tendência de matrículas:', error);
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
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