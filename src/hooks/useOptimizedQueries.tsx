import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook otimizado para buscar alunos usando view materializada
export function useStudentsOptimized() {
  return useQuery({
    queryKey: ['students', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students_with_enrollments')
        .select('*')
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos antes de garbage collection
  });
}

// Hook otimizado para buscar professores usando view materializada
export function useTeachersOptimized() {
  return useQuery({
    queryKey: ['teachers', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_with_classes')
        .select('*')
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos antes de garbage collection
  });
}

// Hook otimizado para buscar turmas usando view materializada
export function useClassesOptimized() {
  return useQuery({
    queryKey: ['classes', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes_with_enrollments')
        .select('*')
        .order('modalidade');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000, // 15 minutos antes de garbage collection
  });
}

// Hook para refresh das views materializadas (quando necessário)
export function useRefreshMaterializedViews() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Refresh das views materializadas
      const refreshQueries = [
        supabase.rpc('refresh_materialized_view', { view_name: 'students_with_enrollments' }),
        supabase.rpc('refresh_materialized_view', { view_name: 'staff_with_classes' }),
        supabase.rpc('refresh_materialized_view', { view_name: 'classes_with_enrollments' })
      ];
      
      await Promise.all(refreshQueries);
    },
    onSuccess: () => {
      // Invalidar os caches das consultas otimizadas
      queryClient.invalidateQueries({ queryKey: ['students', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'optimized'] });
      
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar dados: ${error.message}`);
    },
  });
}

// Hook para estatísticas rápidas (sem JOIN complexo)
export function useQuickStats() {
  return useQuery({
    queryKey: ['stats', 'quick'],
    queryFn: async () => {
      const [studentsResult, teachersResult, classesResult] = await Promise.all([
        supabase.from('students_with_enrollments').select('auth_status, active_enrollments'),
        supabase.from('staff_with_classes').select('id'),
        supabase.from('classes_with_enrollments').select('ativa, active_enrollments')
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;
      if (classesResult.error) throw classesResult.error;

      const students = studentsResult.data || [];
      const teachers = teachersResult.data || [];
      const classes = classesResult.data || [];

      return {
        totalStudents: students.length,
        approvedStudents: students.filter(s => s.auth_status === 'approved').length,
        pendingStudents: students.filter(s => s.auth_status === 'pending').length,
        activeEnrollments: students.reduce((sum, s) => sum + (s.active_enrollments || 0), 0),
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        activeClasses: classes.filter(c => c.ativa).length,
        totalClassEnrollments: classes.reduce((sum, c) => sum + (c.active_enrollments || 0), 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos de cache para stats
    gcTime: 10 * 60 * 1000, // 10 minutos antes de garbage collection
  });
}