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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Palette } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255, 'Nome muito longo'),
});

type FormData = z.infer<typeof formSchema>;

interface ClassType {
  id: string;
  name: string;
}

interface ClassTypeFormModalProps {
  open: boolean;
  onClose: () => void;
  classType?: ClassType | null;
  onSuccess: () => void;
}

export function ClassTypeFormModal({ open, onClose, classType, onSuccess }: ClassTypeFormModalProps) {
  const { toast } = useToast();
  const isEditing = !!classType;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    console.log('ClassTypeFormModal: useEffect executado', {
      classType: classType ? { id: classType.id, name: classType.name } : null,
      isEditing
    });

    if (classType) {
      form.reset({
        name: classType.name,
      });
      console.log('ClassTypeFormModal: Formulário resetado com dados da modalidade:', classType.name);
    } else {
      form.reset({
        name: '',
      });
      console.log('ClassTypeFormModal: Formulário resetado para nova modalidade');
    }
  }, [classType, form, isEditing]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('ClassTypeFormModal: Criando nova modalidade:', data);
      
      const { error, data: createdData } = await supabase
        .from('class_types')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('ClassTypeFormModal: Erro ao criar modalidade:', error);
        throw error;
      }

      console.log('ClassTypeFormModal: Modalidade criada com sucesso:', createdData);
      return createdData;
    },
    onSuccess: (createdData) => {
      console.log('ClassTypeFormModal: Create onSuccess chamado:', createdData);
      toast({
        title: 'Modalidade criada',
        description: `Nova modalidade "${createdData.name}" foi adicionada com sucesso`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('ClassTypeFormModal: Create onError:', error);
      let errorMessage = 'Erro desconhecido ao criar modalidade';
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        errorMessage = 'Já existe uma modalidade com este nome';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro ao criar modalidade',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!classType) {
        console.error('ClassTypeFormModal: Tentativa de atualização sem classType');
        throw new Error('Modalidade não encontrada para atualização');
      }

      console.log('ClassTypeFormModal: Iniciando atualização da modalidade', {
        id: classType.id,
        currentName: classType.name,
        newData: data
      });

      const { error, data: updatedData } = await supabase
        .from('class_types')
        .update(data)
        .eq('id', classType.id)
        .select()
        .single();

      if (error) {
        console.error('ClassTypeFormModal: Erro no Supabase ao atualizar modalidade:', error);
        throw error;
      }

      console.log('ClassTypeFormModal: Modalidade atualizada com sucesso:', updatedData);
      return updatedData;
    },
    onSuccess: (updatedData) => {
      console.log('ClassTypeFormModal: onSuccess chamado com dados:', updatedData);
      toast({
        title: 'Modalidade atualizada',
        description: `Modalidade "${updatedData.name}" foi atualizada com sucesso`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      console.error('ClassTypeFormModal: onError chamado:', error);
      toast({
        title: 'Erro ao atualizar modalidade',
        description: error.message || 'Erro desconhecido ao atualizar modalidade',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log('ClassTypeFormModal: onSubmit chamado', {
      isEditing,
      data,
      classType: classType ? { id: classType.id, name: classType.name } : null
    });

    if (isEditing) {
      console.log('ClassTypeFormModal: Executando updateMutation');
      updateMutation.mutate(data);
    } else {
      console.log('ClassTypeFormModal: Executando createMutation');
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {isEditing ? 'Editar Modalidade' : 'Nova Modalidade'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize as informações da modalidade de dança' 
              : 'Adicione uma nova modalidade de dança à escola'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Modalidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ballet, Jazz, Hip Hop..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />





            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log('ClassTypeFormModal: Botão Cancelar clicado');
                  onClose();
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !form.formState.isValid} 
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading 
                  ? (isEditing ? 'Salvando...' : 'Criando...') 
                  : (isEditing ? 'Salvar Alterações' : 'Criar Modalidade')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}