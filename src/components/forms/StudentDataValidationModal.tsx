/**
 * Modal para corrigir dados incompletos do estudante
 * 
 * Usado quando o estudante tenta se matricular mas seus dados
 * estão incompletos para criação do cliente Asaas.
 * 
 * Permite editar: CPF, telefone/WhatsApp, endereço e CEP
 */

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, User, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateStudentForAsaas, getErrorMessage, getMissingFields, type ValidationError } from '@/utils/studentDataValidator';

// Schema de validação
const formSchema = z.object({
  cpf: z.string()
    .min(11, 'CPF deve ter 11 dígitos')
    .regex(/^\d{11}$|^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato de CPF inválido'),
  whatsapp: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .regex(/^\d{10,11}$|^(\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4}$/, 'Formato de telefone inválido'),
  endereco_completo: z.string().optional(),
  cep: z.string()
    .optional()
    .refine((val) => !val || /^\d{8}$|^\d{5}-\d{3}$/.test(val), 'Formato de CEP inválido'),
});

// Tipos
interface StudentData {
  id: string;
  asaas_customer_id?: string;
  endereco_completo?: string;
  cep?: string;
  whatsapp?: string;
  profiles: {
    nome_completo: string;
    email: string;
    cpf: string;
    whatsapp?: string;
    telefone?: string;
  };
}

interface StudentDataValidationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentData: StudentData | null;
  validationErrors: ValidationError[];
  onSuccess: (updatedData: StudentData) => void;
}

export function StudentDataValidationModal({ 
  open, 
  onOpenChange, 
  studentData, 
  validationErrors,
  onSuccess 
}: StudentDataValidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cpf: '',
      whatsapp: '',
      endereco_completo: '',
      cep: '',
    },
  });

  // Carregar dados do estudante no formulário
  useEffect(() => {
    if (open && studentData) {
      const currentPhone = studentData.profiles?.whatsapp || 
                          studentData.profiles?.telefone || 
                          studentData.whatsapp || '';
      
      form.reset({
        cpf: studentData.profiles?.cpf || '',
        whatsapp: currentPhone,
        endereco_completo: studentData.endereco_completo || '',
        cep: studentData.cep || '',
      });
    }
  }, [open, studentData, form]);

  // Função para validar dados em tempo real
  const handleValidateData = async () => {
    if (!studentData) return;

    setValidating(true);
    
    try {
      const formData = form.getValues();
      
      // Criar objeto com dados atualizados para validação
      const updatedStudentData = {
        ...studentData,
        endereco_completo: formData.endereco_completo,
        cep: formData.cep,
        whatsapp: formData.whatsapp,
        profiles: {
          ...studentData.profiles,
          cpf: formData.cpf,
          whatsapp: formData.whatsapp,
        }
      };

      const validation = validateStudentForAsaas(updatedStudentData);
      
      if (validation.valid) {
        toast({
          title: 'Dados válidos',
          description: 'Todos os campos obrigatórios foram preenchidos corretamente!',
        });
      } else {
        const errorMessage = getErrorMessage(validation.errors);
        toast({
          title: 'Dados ainda incompletos',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      toast({
        title: 'Erro na validação',
        description: 'Não foi possível validar os dados',
        variant: 'destructive'
      });
    } finally {
      setValidating(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!studentData) return;

    setLoading(true);
    
    try {
      // Atualizar profile com dados básicos
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          cpf: values.cpf.replace(/\D/g, ''), // Salvar CPF sem formatação
          whatsapp: values.whatsapp.replace(/\D/g, ''), // Salvar telefone sem formatação
        })
        .eq('id', studentData.id);

      if (profileError) throw profileError;

      // Atualizar dados específicos do estudante
      const { error: studentError } = await supabase
        .from('students')
        .update({
          endereco_completo: values.endereco_completo || null,
          cep: values.cep?.replace(/\D/g, '') || null,
          whatsapp: values.whatsapp.replace(/\D/g, ''),
        })
        .eq('id', studentData.id);

      if (studentError) throw studentError;

      // Criar objeto com dados atualizados
      const updatedData: StudentData = {
        ...studentData,
        endereco_completo: values.endereco_completo,
        cep: values.cep,
        whatsapp: values.whatsapp,
        profiles: {
          ...studentData.profiles,
          cpf: values.cpf,
          whatsapp: values.whatsapp,
        }
      };

      toast({
        title: 'Dados atualizados',
        description: 'Suas informações foram salvas com sucesso!',
      });

      onSuccess(updatedData);
      onOpenChange(false);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível salvar os dados';
      console.error('Erro ao atualizar dados:', error);
      toast({
        title: 'Erro ao salvar',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return numbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Helper para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
    return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  // Helper para formatar CEP
  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  if (!studentData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Completar Dados para Matrícula
          </DialogTitle>
          <DialogDescription>
            Para prosseguir com a matrícula, precisamos completar algumas informações obrigatórias.
          </DialogDescription>
        </DialogHeader>

        {/* Informações do estudante */}
        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{studentData.profiles.nome_completo}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {studentData.profiles.email}
          </div>
        </div>

        {/* Lista de campos com problemas */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-2">Campos que precisam ser corrigidos:</div>
              <ul className="list-disc list-inside space-y-1">
                {getMissingFields(validationErrors).map((field, index) => (
                  <li key={index} className="text-sm">{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    CPF
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
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
                  <FormLabel className="flex items-center gap-2">
                    WhatsApp/Telefone
                    <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco_completo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Rua, número, bairro, cidade - UF"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCEP(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateData}
                disabled={validating || loading}
              >
                {validating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Validando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar Dados
                  </>
                )}
              </Button>

              <div className="space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || validating}
                  className="bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Salvar e Continuar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Informação sobre segurança */}
        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mt-4">
          <div className="text-xs text-blue-800 dark:text-blue-200">
            <strong>🔒 Seus dados estão seguros:</strong> As informações são armazenadas de forma segura 
            e usadas apenas para processar sua matrícula e pagamentos.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}