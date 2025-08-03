import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Student {
  id: string;
  nome_completo: string;
  cpf: string;
  whatsapp: string;
  data_nascimento: string;
  endereco: string;
  contato_emergencia: string;
  info_medicas: string;
  auth_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Hook para buscar todos os estudantes
export function useStudents() {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          nome_completo,
          cpf,
          whatsapp,
          auth_status,
          created_at,
          updated_at,
          profiles(nome_completo, email, role),
          enrollments(
            id,
            status,
            data_matricula,
            ativa
          )
        `)
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 10 * 60 * 1000, // 10 minutos antes de garbage collection
  });
}

// Hook para buscar um estudante por ID
export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles(nome_completo, email, role),
          enrollments(
            *,
            classes(nome, modalidade, professor_principal_id)
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

// Hook para buscar estudantes ativos (com matrículas)
export function useActiveStudents() {
  return useQuery({
    queryKey: ['students', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profiles(nome_completo, email),
          enrollments!inner(status)
        `)
        .eq('enrollments.status', 'ativa')
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para atualizar status de aprovação do estudante
export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('students')
        .update({ auth_status: status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(
        status === 'approved' 
          ? 'Estudante aprovado com sucesso!' 
          : 'Estudante rejeitado'
      );
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });
}

// Hook para adicionar nota ao estudante
export function useAddStudentNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ studentId, note }: { studentId: string; note: string }) => {
      const { error } = await supabase
        .from('notes')
        .insert([{
          student_id: studentId,
          content: note,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Nota adicionada com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar nota: ${error.message}`);
    },
  });
}