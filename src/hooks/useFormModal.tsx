import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

interface UseFormModalOptions<T extends z.ZodSchema> {
  schema: T;
  tableName: string;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
  queryKeys?: string[];
  transform?: (data: z.infer<T>) => any;
}

export function useFormModal<T extends z.ZodSchema>({
  schema,
  tableName,
  onSuccess,
  successMessage = 'Item criado com sucesso!',
  errorMessage = 'Erro ao criar item',
  queryKeys = [],
  transform
}: UseFormModalOptions<T>) {
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<T>) => {
      const transformedData = transform ? transform(data) : data;
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([transformedData])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success(successMessage);
      form.reset();
      
      // Invalidate all provided query keys
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error creating item:', error);
      toast.error(`${errorMessage}: ${error.message || 'Erro desconhecido'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<T> }) => {
      const transformedData = transform ? transform(data) : data;
      const { data: result, error } = await supabase
        .from(tableName)
        .update(transformedData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success(successMessage.replace('criado', 'atualizado'));
      form.reset();
      
      // Invalidate all provided query keys
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error updating item:', error);
      toast.error(`${errorMessage.replace('criar', 'atualizar')}: ${error.message || 'Erro desconhecido'}`);
    },
  });

  const handleSubmit = (data: z.infer<T>, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return {
    form,
    handleSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
    isSuccess: createMutation.isSuccess || updateMutation.isSuccess,
    error: createMutation.error || updateMutation.error,
  };
}