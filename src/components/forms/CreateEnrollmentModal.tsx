import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  student_id: z.string().min(1, 'Selecione um aluno'),
  class_id: z.string().min(1, 'Selecione uma turma'),
  data_matricula: z.string().min(1, 'Data de matrícula é obrigatória'),
  valor_pago_matricula: z.string().optional(),
});

interface Student {
  id: string;
  profiles: {
    nome_completo: string;
    email: string;
  };
}

interface Class {
  id: string;
  modalidade: string;
  nivel: string;
  horario_inicio: string;
  horario_fim: string;
  valor_matricula: number | null;
}

interface CreateEnrollmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateEnrollmentModal({ open, onOpenChange, onSuccess }: CreateEnrollmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      student_id: '',
      class_id: '',
      data_matricula: new Date().toISOString().split('T')[0],
      valor_pago_matricula: '',
    },
  });

  const selectedClassId = form.watch('class_id');
  const selectedClass = classes.find(c => c.id === selectedClassId);

  useEffect(() => {
    if (open) {
      loadStudents();
      loadClasses();
    }
  }, [open]);

  useEffect(() => {
    if (selectedClass?.valor_matricula) {
      form.setValue('valor_pago_matricula', selectedClass.valor_matricula.toString());
    }
  }, [selectedClass, form]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          profiles!students_id_fkey(
            nome_completo,
            email
          )
        `)
        .order('profiles(nome_completo)');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, modalidade, nivel, horario_inicio, horario_fim, valor_matricula')
        .eq('ativa', true)
        .order('modalidade');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Check if student is already enrolled in this class
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', values.student_id)
        .eq('class_id', values.class_id)
        .eq('ativa', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingEnrollment) {
        throw new Error('Este aluno já está matriculado nesta turma');
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: values.student_id,
          class_id: values.class_id,
          data_matricula: values.data_matricula,
          valor_pago_matricula: values.valor_pago_matricula ? parseFloat(values.valor_pago_matricula) : null,
          ativa: true,
        });

      if (error) throw error;

      toast({
        title: 'Matrícula criada com sucesso',
        description: 'O aluno foi matriculado na turma',
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar matrícula',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Matrícula</DialogTitle>
          <DialogDescription>
            Matricule um aluno em uma turma ativa
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.profiles.nome_completo} - {student.profiles.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma turma" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.modalidade} - {classItem.nivel} 
                          ({classItem.horario_inicio} - {classItem.horario_fim})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_matricula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Matrícula</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_pago_matricula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Pago da Matrícula (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Matrícula'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}