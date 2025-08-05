import { useEffect } from 'react';
import * as z from 'zod';
import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { useFormModal } from '@/hooks/useFormModal';
import { BookOpen } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

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
  const isEditing = !!classData;

  const { form, handleSubmit, isLoading } = useFormModal({
    schema: formSchema,
    tableName: 'classes',
    onSuccess: () => {
      onClose();
      onSuccess();
    },
    successMessage: isEditing ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!',
    errorMessage: isEditing ? 'Erro ao atualizar turma' : 'Erro ao criar turma',
    queryKeys: ['classes'],
    transform: (data: FormData) => ({
      nome: null,
      modalidade: data.modalidade,
      nivel: 'basico' as const,
      tipo: 'regular' as const,
      dias_semana: ['segunda'],
      horario_inicio: '09:00',
      horario_fim: '10:00',
      tempo_total_minutos: 60,
      valor_aula: data.valor_aula,
      valor_matricula: null,
      professor_principal_id: null,
      data_inicio: '2024-01-01',
      data_termino: null,
      observacoes: null,
      ativa: true,
    })
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

  const onSubmit = (data: FormData) => {
    handleSubmit(data, classData?.id);
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar Turma' : 'Nova Turma'}
      description={isEditing 
        ? 'Atualize as informações da turma' 
        : 'Adicione uma nova turma à escola'
      }
      form={form}
      onSubmit={onSubmit}
      isLoading={isLoading}
      icon={<BookOpen className="h-5 w-5" />}
      isEditing={isEditing}
    >
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
    </FormModal>
  );
}