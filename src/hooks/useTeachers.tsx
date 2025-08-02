import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Teacher {
  id: string;
  profile_id: string;
  especialidades: string[];
  taxa_comissao: number;
  chave_pix: string;
  dados_bancarios: {
    banco: string;
    agencia: string;
    conta: string;
    tipo_conta: string;
  };
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Hook para buscar todos os professores
export function useTeachers() {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles(nome_completo, email, role)
        `)
        .eq('profiles.role', 'professor')
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar professores ativos
export function useActiveTeachers() {
  return useQuery({
    queryKey: ['teachers', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles(nome_completo, email, role)
        `)
        .eq('profiles.role', 'professor')
        .eq('ativo', true)
        .order('nome_completo');
      
      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar um professor por ID
export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          profiles(nome_completo, email, role),
          classes(
            id,
            nome,
            modalidade,
            horario_inicio,
            horario_fim,
            enrollments(count)
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

// Hook para buscar comissões do professor
export function useTeacherCommissions(teacherId: string, month?: string, year?: string) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'commissions', month, year],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          classes(
            nome,
            modalidade,
            valor_aula,
            staff(taxa_comissao)
          ),
          students(profiles(nome_completo))
        `)
        .eq('classes.professor_principal_id', teacherId)
        .eq('presente', true);

      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = `${year}-${month.padStart(2, '0')}-31`;
        query = query.gte('data_aula', startDate).lte('data_aula', endDate);
      }

      const { data, error } = await query.order('data_aula', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });
}

// Hook para criar professor
export function useCreateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teacherData: {
      email: string;
      nome_completo: string;
      cpf: string;
      whatsapp: string;
      especialidades: string[];
      taxa_comissao?: number;
      chave_pix?: string;
      dados_bancarios?: any;
    }) => {
      // First create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          email: teacherData.email,
          nome_completo: teacherData.nome_completo,
          role: 'professor'
        }])
        .select()
        .single();
      
      if (profileError) throw profileError;

      // Then create staff record
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .insert([{
          profile_id: profile.id,
          cpf: teacherData.cpf,
          whatsapp: teacherData.whatsapp,
          especialidades: teacherData.especialidades,
          taxa_comissao: teacherData.taxa_comissao || 50,
          chave_pix: teacherData.chave_pix,
          dados_bancarios: teacherData.dados_bancarios,
          ativo: true
        }])
        .select()
        .single();
      
      if (staffError) throw staffError;
      return staff;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar professor: ${error.message}`);
    },
  });
}

// Hook para atualizar professor
export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Teacher> }) => {
      const { data: result, error } = await supabase
        .from('staff')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor atualizado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar professor: ${error.message}`);
    },
  });
}

// Hook para desativar professor
export function useDeactivateTeacher() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Professor desativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(`Erro ao desativar professor: ${error.message}`);
    },
  });
}