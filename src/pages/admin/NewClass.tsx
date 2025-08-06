import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';

const diasSemana = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

const formSchema = z.object({
  nome: z.string().optional(),
  modalidade: z.string().min(1, 'Modalidade é obrigatória'),
  professor_principal_id: z.string().optional(),
  nivel: z.enum(['basico', 'intermediario', 'avancado']),
  dias_semana: z.array(z.string()).min(1, 'Selecione pelo menos um dia da semana'),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório'),
  horario_fim: z.string().min(1, 'Horário de fim é obrigatório'),
  valor_aula: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  data_inicio: z.string().optional(),
  observacoes: z.string().optional(),
  ativa: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface ClassType {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  profiles: {
    nome_completo: string;
  };
}

const useClassTypes = () => {
  return useQuery({
    queryKey: ['class-types'],
    queryFn: async (): Promise<ClassType[]> => {
      const { data, error } = await supabase
        .from('class_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers-active'],
    queryFn: async (): Promise<Teacher[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome_completo
        `)
        .eq('role', 'professor')
        .eq('status', 'ativo')
        .order('nome_completo');

      if (error) throw error;
      
      // Transform to match expected interface
      return data?.map(profile => ({
        id: profile.id,
        profiles: {
          nome_completo: profile.nome_completo
        }
      })) || [];
    },
  });
};

export default function NewClass() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: classTypes, isLoading: classTypesLoading } = useClassTypes();
  const { data: teachers, isLoading: teachersLoading } = useTeachers();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      modalidade: '',
      professor_principal_id: '',
      nivel: 'basico',
      dias_semana: [],
      horario_inicio: '09:00',
      horario_fim: '10:00',
      valor_aula: 150,
      data_inicio: new Date().toISOString().split('T')[0],
      observacoes: '',
      ativa: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Calculate duration in minutes
      const [startHour, startMin] = data.horario_inicio.split(':').map(Number);
      const [endHour, endMin] = data.horario_fim.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const duration = endMinutes - startMinutes;

      if (duration <= 0) {
        throw new Error('O horário de término deve ser posterior ao horário de início');
      }

      const classData = {
        nome: data.nome || null,
        modalidade: data.modalidade,
        nivel: data.nivel,
        tipo: 'regular' as const,
        dias_semana: data.dias_semana,
        horario_inicio: data.horario_inicio,
        horario_fim: data.horario_fim,
        tempo_total_minutos: duration,
        valor_aula: data.valor_aula,
        valor_matricula: null,
        professor_principal_id: data.professor_principal_id || null,
        data_inicio: data.data_inicio,
        data_termino: null,
        observacoes: data.observacoes || null,
        ativa: data.ativa,
      };

      const { error } = await supabase
        .from('classes')
        .insert([classData]);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Turma criada com sucesso!',
        description: 'A nova turma foi adicionada ao sistema.',
      });
      navigate('/admin/classes');
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar turma',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = classTypesLoading || teachersLoading || isSubmitting;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/classes')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold dance-text-gradient">Nova Turma</h1>
          <p className="text-muted-foreground">
            Adicione uma nova turma à escola
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Informações da Turma
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar uma nova turma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome da turma e Professor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Turma (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Ballet Infantil A" {...field} />
                      </FormControl>
                      <FormDescription>
                        Se não informado, será gerado automaticamente baseado na modalidade e nível
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="professor_principal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professor Principal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um professor (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.profiles.nome_completo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Modalidade e Nível */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modalidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidade *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a modalidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {classTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
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
                  name="nivel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="basico">Básico</SelectItem>
                          <SelectItem value="intermediario">Intermediário</SelectItem>
                          <SelectItem value="avancado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dias da semana */}
              <FormField
                control={form.control}
                name="dias_semana"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Dias da Semana *</FormLabel>
                      <FormDescription>
                        Selecione os dias em que esta turma acontece
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {diasSemana.map((dia) => (
                        <FormField
                          key={dia.id}
                          control={form.control}
                          name="dias_semana"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={dia.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(dia.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, dia.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== dia.id
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {dia.label}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Horários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horario_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Início *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horario_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário de Fim *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              {/* Valor e Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valor_aula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="150.00"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações adicionais sobre a turma..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Turma Ativa */}
              <FormField
                control={form.control}
                name="ativa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Turma Ativa</FormLabel>
                      <FormDescription>
                        Turmas inativas não aparecerão para matrícula
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/classes')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Turma
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}