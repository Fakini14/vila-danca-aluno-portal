import { useEffect } from 'react';
import * as z from 'zod';
import { FormModal } from '@/components/shared/FormModal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormModal } from '@/hooks/useFormModal';
import { useTeachersOptimized } from '@/hooks/useOptimizedQueries';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// Schema completo para turmas
const formSchema = z.object({
  nome: z.string().optional(),
  class_type_id: z.string().min(1, 'Modalidade é obrigatória'),
  professor_principal_id: z.string().optional(),
  nivel: z.enum(['basico', 'intermediario', 'avancado']),
  tipo: z.enum(['regular', 'workshop', 'particular', 'outra']),
  dias_semana: z.array(z.string()).min(1, 'Selecione pelo menos um dia da semana'),
  horario_inicio: z.string().min(1, 'Horário de início é obrigatório'),
  horario_fim: z.string().min(1, 'Horário de fim é obrigatório'),
  valor_aula: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  valor_matricula: z.number().min(0, 'Valor de matrícula deve ser maior ou igual a 0').optional(),
  data_inicio: z.string().min(1, 'Data de início é obrigatória'),
  data_termino: z.string().optional(),
  observacoes: z.string().optional(),
  ativa: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

// Dados dos dias da semana
const diasSemana = [
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
  { id: 'domingo', label: 'Domingo' },
];

// Hook para buscar tipos de turma
const useClassTypes = () => {
  return useQuery({
    queryKey: ['class-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_types')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
};

interface ClassData {
  id: string;
  nome: string | null;
  modalidade: string;
  class_type_id: string | null;
  nivel: 'basico' | 'intermediario' | 'avancado';
  tipo: 'regular' | 'workshop' | 'particular' | 'outra';
  data_inicio: string;
  data_termino: string | null;
  dias_semana: string[];
  horario_inicio: string;
  horario_fim: string;
  tempo_total_minutos: number;
  valor_aula: number;
  valor_matricula: number | null;
  ativa: boolean;
  professor_principal_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  professor_nome: string | null;
  // Campos calculados pela view materializada
  total_enrollments: number;
  active_enrollments: number;
}

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  classData?: ClassData | null;
  onSuccess: () => void;
}

export function ClassFormModal({ open, onClose, classData, onSuccess }: ClassFormModalProps) {
  const isEditing = !!classData;
  
  // Hooks para buscar dados
  const { data: teachers = [] } = useTeachersOptimized();
  const { data: classTypes = [] } = useClassTypes();

  const { form, handleSubmit, isLoading } = useFormModal({
    schema: formSchema,
    tableName: 'classes',
    onSuccess: () => {
      onClose();
      onSuccess();
    },
    successMessage: isEditing ? 'Turma atualizada com sucesso!' : 'Turma criada com sucesso!',
    errorMessage: isEditing ? 'Erro ao atualizar turma' : 'Erro ao criar turma',
    queryKeys: ['classes', 'optimized'],
    transform: (data: FormData) => {
      // Calcular tempo total em minutos
      const inicio = new Date(`2024-01-01T${data.horario_inicio}`);
      const fim = new Date(`2024-01-01T${data.horario_fim}`);
      const tempoTotalMinutos = (fim.getTime() - inicio.getTime()) / (1000 * 60);

      return {
        nome: data.nome || null,
        class_type_id: data.class_type_id,
        nivel: data.nivel,
        tipo: data.tipo,
        dias_semana: data.dias_semana,
        horario_inicio: data.horario_inicio,
        horario_fim: data.horario_fim,
        tempo_total_minutos: tempoTotalMinutos,
        valor_aula: data.valor_aula,
        valor_matricula: data.valor_matricula || null,
        professor_principal_id: data.professor_principal_id || null,
        data_inicio: data.data_inicio,
        data_termino: data.data_termino || null,
        observacoes: data.observacoes || null,
        ativa: data.ativa,
      };
    }
  });

  useEffect(() => {
    if (classData) {
      // Debug logs removidos - deixar console log abaixo para troubleshooting se necessário
      // console.log('🔍 ClassFormModal - dados recebidos:', classData);
      
      // Formatar data para input de data (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        return dateString ? dateString.split('T')[0] : '';
      };

      const formData = {
        nome: classData.nome || '',
        class_type_id: classData.class_type_id || '',
        professor_principal_id: classData.professor_principal_id || '',
        nivel: classData.nivel || 'basico',
        tipo: classData.tipo || 'regular',
        dias_semana: classData.dias_semana || [],
        horario_inicio: classData.horario_inicio || '',
        horario_fim: classData.horario_fim || '',
        valor_aula: classData.valor_aula || 0,
        valor_matricula: classData.valor_matricula || 0,
        data_inicio: formatDateForInput(classData.data_inicio),
        data_termino: classData.data_termino ? formatDateForInput(classData.data_termino) : '',
        observacoes: classData.observacoes || '',
        ativa: classData.ativa ?? true,
      };

      // console.log('📝 ClassFormModal - dados do form:', formData);

      form.reset(formData);
    } else {
      // Valores padrão para nova turma
      const today = new Date().toISOString().split('T')[0];
      form.reset({
        nome: '',
        class_type_id: '',
        professor_principal_id: '',
        nivel: 'basico' as const,
        tipo: 'regular' as const,
        dias_semana: [],
        horario_inicio: '09:00',
        horario_fim: '10:00',
        valor_aula: 150,
        valor_matricula: 0,
        data_inicio: today,
        data_termino: '',
        observacoes: '',
        ativa: true,
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
      <div className="space-y-4">
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
                <FormDescription className="text-xs">
                  Gerado automaticamente se vazio
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um professor (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers?.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Modalidade, Nível e Tipo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <FormField
            control={form.control}
            name="class_type_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidade *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a modalidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
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
                <FormLabel>Nível *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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

          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de turma" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="outra">Outra</SelectItem>
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
              <div className="mb-3">
                <FormLabel className="text-sm">Dias da Semana *</FormLabel>
                <FormDescription className="text-xs">
                  Selecione os dias
                </FormDescription>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {diasSemana.map((dia) => (
                  <FormField
                    key={dia.id}
                    control={form.control}
                    name="dias_semana"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={dia.id}
                          className="flex flex-row items-center space-x-2 space-y-0"
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
                          <FormLabel className="text-xs font-normal">
                            {dia.label.split('-')[0]}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Valores e Datas - Layout Compacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
            name="valor_matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxa Matrícula (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
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
                <FormLabel>Data Início *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_termino"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data Término</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Status */}
        <FormField
          control={form.control}
          name="ativa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-sm">
                  Turma Ativa
                </FormLabel>
                <FormDescription className="text-xs">
                  Aceita matrículas
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormModal>
  );
}