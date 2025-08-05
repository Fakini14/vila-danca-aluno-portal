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

const teacherFormSchema = z.object({
  email: z.string().email('Email inválido'),
  nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  chave_pix: z.string().optional(),
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
  chave_pix: string | null;
  observacoes: string | null;
}

interface TeacherFormModalProps {
  open: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
  onSuccess: () => void;
}


export function TeacherFormModal({ open, onClose, teacher, onSuccess }: TeacherFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: '',
      nome_completo: '',
      cpf: '',
      whatsapp: '',
      chave_pix: '',
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
        chave_pix: teacher.chave_pix || '',
        observacoes: teacher.observacoes || '',
      });
    } else {
      form.reset();
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
            chave_pix: data.chave_pix,
            observacoes: data.observacoes,
          })
          .eq('id', teacher.id)
          .eq('role', 'professor');

        if (profileError) throw profileError;

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

        // Criar entrada na tabela profiles
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            nome_completo: data.nome_completo,
            cpf: data.cpf,
            whatsapp: data.whatsapp,
            email: data.email,
            role: 'professor',
            status: 'ativo',
            chave_pix: data.chave_pix,
            observacoes: data.observacoes,
          });

        if (profileInsertError) throw profileInsertError;

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


            {/* Dados Financeiros */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Financeiros</h3>
              
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