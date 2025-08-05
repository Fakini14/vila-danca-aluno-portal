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
    if (classType) {
      form.reset({
        name: classType.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [classType, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('class_types')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Modalidade criada',
        description: 'Nova modalidade adicionada com sucesso',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar modalidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!classType) return;

      const { error } = await supabase
        .from('class_types')
        .update(data)
        .eq('id', classType.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Modalidade atualizada',
        description: 'Modalidade atualizada com sucesso',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar modalidade',
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
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Modalidade'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}