import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookOpen } from 'lucide-react';

// Schema minimal para teste
const formSchema = z.object({
  modalidade: z.string().min(1, 'Modalidade é obrigatória'),
  valor_aula: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
});

type FormData = z.infer<typeof formSchema>;

interface ClassData {
  id: string;
  modalidade: string;
  valor_aula: number;
}

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  classData?: ClassData | null;
  onSuccess: () => void;
}

export function ClassFormModal({ open, onClose, classData, onSuccess }: ClassFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!classData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modalidade: 'Ballet',
      valor_aula: 150,
    },
  });

  useEffect(() => {
    if (classData) {
      form.reset({
        modalidade: classData.modalidade,
        valor_aula: classData.valor_aula,
      });
    } else {
      form.reset({
        modalidade: 'Ballet',
        valor_aula: 150,
      });
    }
  }, [classData, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const classData = {
        nome: null,
        modalidade: data.modalidade,
        nivel: 'basico' as const,
        tipo: 'regular' as const,
        dias_semana: ['segunda'],
        horario_inicio: '09:00',
        horario_fim: '10:00',
        tempo_total_minutos: 60,
        sala: null,
        capacidade_maxima: 20,
        valor_aula: data.valor_aula,
        valor_matricula: null,
        professor_principal_id: null,
        data_inicio: '2024-01-01',
        data_termino: null,
        observacoes: null,
        ativa: true,
      };

      const { error } = await supabase
        .from('classes')
        .insert([classData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Turma criada',
        description: 'Nova turma adicionada com sucesso',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!classData) return;

      const updateData = {
        modalidade: data.modalidade,
        valor_aula: data.valor_aula,
      };

      const { error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', classData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Turma atualizada',
        description: 'Turma atualizada com sucesso',
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {isEditing ? 'Editar Turma' : 'Nova Turma'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações da turma' 
              : 'Adicione uma nova turma à escola'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modalidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ballet, Jazz..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_aula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Mensal (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="150.00"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Turma'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}