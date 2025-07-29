import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

const teacherFormSchema = z.object({
  email: z.string().email('Email inválido'),
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  especialidades: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
  taxa_comissao: z.number().min(0).max(100).optional(),
  chave_pix: z.string().optional(),
  dados_bancarios: z.object({
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    tipo_conta: z.string().optional(),
  }).optional(),
  observacoes: z.string().optional(),
});

type TeacherFormData = z.infer<typeof teacherFormSchema>;

interface Teacher {
  id: string;
  profiles: {
    nome_completo: string;
    email: string;
    whatsapp: string;
    cpf: string;
    status: string;
  };
  especialidades: string[] | null;
  taxa_comissao: number | null;
  chave_pix: string | null;
  dados_bancarios: any;
  observacoes: string | null;
}

interface TeacherFormModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onSuccess: () => void;
}

const getModalityOptions = () => [
  'Ballet',
  'Jazz',
  'Contemporâneo',
  'Hip Hop',
  'Dança de Salão',
  'Sapateado',
  'Teatro Musical',
  'Dança do Ventre',
  'Zumba',
  'Fitness Dance'
];

export function TeacherFormModal({ open, onClose, teacher, onSuccess }: TeacherFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const { toast } = useToast();

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: '',
      nome_completo: '',
      cpf: '',
      whatsapp: '',
      especialidades: [],
      taxa_comissao: 0,
      chave_pix: '',
      dados_bancarios: {
        banco: '',
        agencia: '',
        conta: '',
        tipo_conta: 'corrente',
      },
      observacoes: '',
    },
  });

  useEffect(() => {
    if (teacher) {
      form.reset({
        email: teacher.profiles.email,
        nome_completo: teacher.profiles.nome_completo,
        cpf: teacher.profiles.cpf || '',
        whatsapp: teacher.profiles.whatsapp,
        especialidades: teacher.especialidades || [],
        taxa_comissao: teacher.taxa_comissao || 0,
        chave_pix: teacher.chave_pix || '',
        dados_bancarios: teacher.dados_bancarios || {
          banco: '',
          agencia: '',
          conta: '',
          tipo_conta: 'corrente',
        },
        observacoes: teacher.observacoes || '',
      });
      setSelectedSpecialties(teacher.especialidades || []);
    } else {
      form.reset();
      setSelectedSpecialties([]);
    }
  }, [teacher, form]);

  const onSubmit = async (data: TeacherFormData) => {
    setIsLoading(true);

    try {
      if (teacher) {
        // Atualizar professor existente
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            nome_completo: data.nome_completo,
            cpf: data.cpf,
            whatsapp: data.whatsapp,
            email: data.email,
          })
          .eq('id', teacher.id);

        if (profileError) throw profileError;

        const { error: staffError } = await supabase
          .from('staff')
          .update({
            especialidades: data.especialidades,
            taxa_comissao: data.taxa_comissao,
            chave_pix: data.chave_pix,
            dados_bancarios: data.dados_bancarios,
            observacoes: data.observacoes,
          })
          .eq('id', teacher.id);

        if (staffError) throw staffError;

        toast({
          title: "Professor atualizado",
          description: "Dados do professor atualizados com sucesso",
        });
      } else {
        // Criar novo professor
        // Primeiro criar o usuário no auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: 'temp123456', // Senha temporária
          email_confirm: true,
          user_metadata: {
            nome_completo: data.nome_completo,
            cpf: data.cpf,
            whatsapp: data.whatsapp,
            role: 'professor'
          }
        });

        if (authError) throw authError;

        // Criar entrada na tabela staff
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            id: authData.user.id,
            funcao: 'professor',
            especialidades: data.especialidades,
            taxa_comissao: data.taxa_comissao,
            chave_pix: data.chave_pix,
            dados_bancarios: data.dados_bancarios,
            observacoes: data.observacoes,
          });

        if (staffError) throw staffError;

        toast({
          title: "Professor criado",
          description: "Novo professor adicionado à equipe. Senha temporária: temp123456",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar professor",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpecialtyToggle = (specialty: string) => {
    const newSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    
    setSelectedSpecialties(newSpecialties);
    form.setValue('especialidades', newSpecialties);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {teacher ? 'Editar Professor' : 'Adicionar Professor'}
          </DialogTitle>
          <DialogDescription>
            {teacher 
              ? 'Atualize as informações do professor'
              : 'Preencha os dados para adicionar um novo professor à equipe'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Dados Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Básicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nome_completo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do professor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@exemplo.com" 
                          {...field}
                          disabled={!!teacher} // Não permite alterar email de professor existente
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF *</FormLabel>
                      <FormControl>
                        <Input placeholder="000.000.000-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp *</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 99999-9999" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Especialidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Especialidades</h3>
              <FormField
                control={form.control}
                name="especialidades"
                render={() => (
                  <FormItem>
                    <FormLabel>Modalidades que ensina *</FormLabel>
                    <FormDescription>
                      Selecione todas as modalidades que o professor pode ensinar
                    </FormDescription>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getModalityOptions().map((specialty) => (
                        <div key={specialty} className="flex items-center space-x-2">
                          <Checkbox
                            id={specialty}
                            checked={selectedSpecialties.includes(specialty)}
                            onCheckedChange={() => handleSpecialtyToggle(specialty)}
                          />
                          <label
                            htmlFor={specialty}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {specialty}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedSpecialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                          <button
                            type="button"
                            onClick={() => handleSpecialtyToggle(specialty)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dados Financeiros */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Financeiros</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxa_comissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa de Comissão (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          placeholder="0.00" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Percentual de comissão sobre as aulas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chave_pix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chave PIX</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF, email ou telefone" {...field} />
                      </FormControl>
                      <FormDescription>
                        Para pagamento de comissões
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dados Bancários */}
              <div className="space-y-3">
                <h4 className="font-medium">Dados Bancários (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dados_bancarios.banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do banco" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dados_bancarios.tipo_conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Conta</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="corrente">Corrente</SelectItem>
                            <SelectItem value="poupanca">Poupança</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dados_bancarios.agencia"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Agência</FormLabel>
                        <FormControl>
                          <Input placeholder="0000" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dados_bancarios.conta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Conta</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-0" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                      placeholder="Informações adicionais sobre o professor..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : teacher ? 'Atualizar' : 'Criar Professor'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}