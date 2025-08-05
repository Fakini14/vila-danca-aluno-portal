import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Class {
  id: string;
  nome: string;
  modalidade: string;
  nivel: 'iniciante' | 'basico' | 'intermediario' | 'avancado';
  tipo: 'regular' | 'intensivo' | 'workshop';
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  tempo_total_minutos: number;
  valor_aula: number;
  valor_matricula: number;
  professor_principal_id: string;
  data_inicio: string;
  data_termino: string;
  observacoes: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

// Hook para buscar todas as turmas
export function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          nome,
          modalidade,
          nivel,
          dias_semana,
          horario_inicio,
          horario_fim,
          valor_aula,
          valor_matricula,
          ativa,
          professor_principal_id,
          created_at,
          tipo,
          profiles!classes_professor_principal_id_fkey(nome_completo)
        `)
        .order('modalidade');
      
      if (error) throw error;
      return data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutos de cache
    gcTime: 8 * 60 * 1000, // 8 minutos antes de garbage collection
  });
}

// Hook para buscar turmas ativas
export function useActiveClasses() {
  return useQuery({
    queryKey: ['classes', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_professor_principal_id_fkey(nome_completo)
        `)
        .eq('ativa', true)
        .order('modalidade');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar uma turma por ID
export function useClass(id: string) {
  return useQuery({
    queryKey: ['classes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_professor_principal_id_fkey(nome_completo, email),
          enrollments(
            *,
            students(profiles(nome_completo, whatsapp))
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// Hook para buscar turmas por professor
export function useClassesByTeacher(teacherId: string) {
  return useQuery({
    queryKey: ['classes', 'teacher', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          enrollments(
            count
          )
        `)
        .eq('professor_principal_id', teacherId)
        .eq('ativa', true)
        .order('horario_inicio');
      
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });
}

// Hook para buscar turmas de hoje
export function useTodayClasses() {
  return useQuery({
    queryKey: ['classes', 'today'],
    queryFn: async () => {
      const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long' });
      const dayMapping: { [key: string]: string } = {
        'segunda-feira': 'segunda',
        'terça-feira': 'terca',
        'quarta-feira': 'quarta',
        'quinta-feira': 'quinta',
        'sexta-feira': 'sexta',
        'sábado': 'sabado',
        'domingo': 'domingo'
      };
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          profiles!classes_professor_principal_id_fkey(nome_completo)
        `)
        .contains('dias_semana', [dayMapping[today]])
        .eq('ativa', true)
        .order('horario_inicio');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para criar turma
export function useCreateClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classData: Partial<Class>) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar turma: ${error.message}`);
    },
  });
}

// Hook para atualizar turma
export function useUpdateClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Class> }) => {
      const { data: result, error } = await supabase
        .from('classes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar turma: ${error.message}`);
    },
  });
}

// Hook para buscar turmas com contagem de matrículas (usado na interface admin)
export function useClassesWithEnrollmentCount() {
  return useQuery({
    queryKey: ['classes', 'with-enrollment-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select(`
          id,
          nome,
          modalidade,
          nivel,
          dias_semana,
          horario_inicio,
          horario_fim,
          valor_aula,
          valor_matricula,
          ativa,
          professor_principal_id,
          created_at,
          tipo,
          profiles!classes_professor_principal_id_fkey(nome_completo),
          enrollments!inner(id)
        `)
        .order('modalidade');
      
      if (error) throw error;
      
      // Processar dados para incluir contagem
      return data.map(cls => ({
        ...cls,
        _count: {
          enrollments: cls.enrollments?.length || 0
        }
      }));
    },
    staleTime: 3 * 60 * 1000, // 3 minutos de cache
    gcTime: 8 * 60 * 1000, // 8 minutos antes de garbage collection
  });
}

// Hook para desativar turma
export function useDeactivateClass() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('classes')
        .update({ ativa: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Turma desativada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao desativar turma: ${error.message}`);
    },
  });
}