import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Hook otimizado para buscar alunos com matrículas
export function useStudentsOptimized() {
  return useQuery({
    queryKey: ['students', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles!inner(
            nome_completo,
            email,
            cpf,
            whatsapp,
            telefone
          ),
          enrollments!left(
            id,
            ativa,
            data_matricula,
            classes(nome, modalidade, class_types(name))
          )
        `)
        .order('profiles(nome_completo)');
      
      if (error) throw error;
      
      // Calcular estatísticas de matrícula para cada aluno
      return data.map(student => ({
        ...student,
        nome_completo: student.profiles?.nome_completo || '',
        email: student.profiles?.email || '',
        cpf: student.profiles?.cpf || '',
        whatsapp: student.profiles?.whatsapp || '',
        telefone: student.profiles?.telefone || '',
        active_enrollments: student.enrollments?.filter(e => e.ativa).length || 0,
        total_enrollments: student.enrollments?.length || 0
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos antes de garbage collection
  });
}

// Hook otimizado para buscar professores usando tabela profiles
export function useTeachersOptimized() {
  return useQuery({
    queryKey: ['teachers', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome_completo,
          email,
          cpf,
          whatsapp,
          chave_pix,
          role,
          status,
          created_at,
          updated_at,
          classes!classes_professor_principal_id_fkey(
            id,
            nome,
            modalidade,
            class_types(name),
            ativa
          )
        `)
        .eq('role', 'professor')
        .eq('status', 'ativo')
        .order('nome_completo');
      
      if (error) throw error;
      
      // Calcular estatísticas de turmas para cada professor
      return data.map(teacher => ({
        ...teacher,
        total_classes: teacher.classes?.length || 0,
        active_classes: teacher.classes?.filter(c => c.ativa).length || 0
      }));
    },
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 30 * 60 * 1000, // 30 minutos antes de garbage collection
  });
}

// Hook otimizado para buscar turmas com estatísticas de matrícula
export function useClassesOptimized() {
  return useQuery({
    queryKey: ['classes', 'optimized'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          class_types(id, name),
          profiles!classes_professor_principal_id_fkey(id, nome_completo),
          enrollments!left(id, ativa)
        `)
        .order('modalidade');
      
      if (error) throw error;
      
      // Calcular estatísticas de matrícula para cada turma
      return data.map(classItem => ({
        ...classItem,
        active_enrollments: classItem.enrollments?.filter(e => e.ativa).length || 0,
        total_enrollments: classItem.enrollments?.length || 0,
        professor_nome: classItem.profiles?.nome_completo || null
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000, // 15 minutos antes de garbage collection
  });
}

// Hook para refresh dos dados (invalidação de cache)
export function useRefreshOptimizedData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      // Apenas invalidar os caches - os dados serão recarregados automaticamente
      return Promise.resolve();
    },
    onSuccess: () => {
      // Invalidar os caches das consultas otimizadas
      queryClient.invalidateQueries({ queryKey: ['students', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['teachers', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['classes', 'optimized'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'quick'] });
      
      toast.success('Dados atualizados com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar dados: ${error.message}`);
    },
  });
}

// Hook para estatísticas rápidas (consultas diretas)
export function useQuickStats() {
  return useQuery({
    queryKey: ['stats', 'quick'],
    queryFn: async () => {
      const [studentsResult, teachersResult, classesResult] = await Promise.all([
        supabase.from('students').select('auth_status, enrollments!left(id, ativa)'),
        supabase.from('profiles').select('id').eq('role', 'professor').eq('status', 'ativo'),
        supabase.from('classes').select('id, ativa, enrollments!left(id, ativa)')
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;
      if (classesResult.error) throw classesResult.error;

      const students = studentsResult.data || [];
      const teachers = teachersResult.data || [];
      const classes = classesResult.data || [];

      // Calcular matrículas ativas para cada aluno
      const studentsWithStats = students.map(student => ({
        ...student,
        active_enrollments: student.enrollments?.filter(e => e.ativa).length || 0
      }));

      // Calcular matrículas ativas para cada turma
      const classesWithStats = classes.map(classItem => ({
        ...classItem,
        active_enrollments: classItem.enrollments?.filter(e => e.ativa).length || 0
      }));

      return {
        totalStudents: students.length,
        approvedStudents: students.filter(s => s.auth_status === 'approved').length,
        pendingStudents: students.filter(s => s.auth_status === 'pending').length,
        activeEnrollments: studentsWithStats.reduce((sum, s) => sum + s.active_enrollments, 0),
        totalTeachers: teachers.length,
        totalClasses: classes.length,
        activeClasses: classes.filter(c => c.ativa).length,
        totalClassEnrollments: classesWithStats.reduce((sum, c) => sum + c.active_enrollments, 0)
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutos de cache para stats
    gcTime: 10 * 60 * 1000, // 10 minutos antes de garbage collection
  });
}