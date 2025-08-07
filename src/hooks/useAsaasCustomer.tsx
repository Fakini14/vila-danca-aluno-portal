/**
 * Hook para gerenciar clientes Asaas
 * 
 * Responsável por:
 * - Validar dados obrigatórios do estudante
 * - Verificar se estudante já possui asaas_customer_id
 * - Criar cliente no Asaas quando necessário
 * - Cache inteligente para evitar chamadas desnecessárias
 * - Tratamento robusto de erros e edge cases
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateStudentForAsaas, getErrorMessage, getMissingFields, type StudentValidationData, type ValidationError } from '@/utils/studentDataValidator';

// Tipos
interface StudentData {
  id: string;
  asaas_customer_id?: string;
  profiles: {
    nome_completo: string;
    email: string;
    cpf: string;
    whatsapp?: string;
  };
  endereco_completo?: string;
  cep?: string;
  whatsapp?: string;
}

interface ValidationResult {
  valid: boolean;
  missing: string[];
  student: StudentData | null;
  errors: string[];
  validationErrors: ValidationError[];
}

interface AsaasCustomerResult {
  success: boolean;
  asaas_customer_id: string;
  message?: string;
  error?: string;
}

interface UseAsaasCustomerReturn {
  ensureAsaasCustomer: (studentId: string) => Promise<string>;
  validateStudentData: (studentId: string) => Promise<ValidationResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

// Utilitário para timeout com Promise.race (seguindo padrão do useAuth)
const withTimeout = <T,>(promise: Promise<T>, ms: number, operation: string): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${operation} timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
};

// Cache em memória para evitar validações desnecessárias
const validationCache = new Map<string, { result: ValidationResult; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

export function useAsaasCustomer(): UseAsaasCustomerReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const isOperationInProgress = useRef<boolean>(false);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validar dados do estudante
  const validateStudentData = useCallback(async (studentId: string): Promise<ValidationResult> => {
    // Verificar cache primeiro (comentado temporariamente para debug)
    const cached = validationCache.get(studentId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('🚀 Using cached validation for student:', studentId);
      console.log('🗂️ Cached result:', cached.result);
      // return cached.result; // Desabilitado para debug
    }
    
    console.log('🔄 Performing fresh validation for student:', studentId);

    try {
      const { data: student, error: fetchError } = await withTimeout(
        supabase
          .from('students')
          .select(`
            id,
            asaas_customer_id,
            endereco_completo,
            cep,
            whatsapp,
            profiles!students_id_fkey(
              nome_completo,
              email,
              cpf,
              whatsapp
            )
          `)
          .eq('id', studentId)
          .single(),
        10000,
        'Student data fetch'
      );

      if (fetchError) {
        throw new Error(`Erro ao buscar dados do estudante: ${fetchError.message}`);
      }

      if (!student) {
        throw new Error('Estudante não encontrado');
      }

      console.log('📋 Dados do estudante obtidos:', JSON.stringify(student, null, 2));
      
      // Usar o novo utilitário de validação
      const validation = validateStudentForAsaas(student as StudentValidationData);
      
      console.log('✅ Resultado da validação:', {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      });
      
      const result: ValidationResult = {
        valid: validation.valid,
        missing: getMissingFields(validation.errors),
        student: student as StudentData,
        errors: validation.errors.map(err => err.message),
        validationErrors: validation.errors,
      };
      
      console.log('📊 Resultado final da validação:', result);

      // Log de warnings se existirem
      if (validation.warnings.length > 0) {
        console.warn('⚠️ Dados com warnings:', validation.warnings.map(w => w.message));
      }

      // Armazenar no cache
      validationCache.set(studentId, {
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Erro na validação dos dados:', error);
      const result: ValidationResult = {
        valid: false,
        missing: ['Erro ao carregar dados'],
        student: null,
        errors: [errorMessage],
        validationErrors: [],
      };
      return result;
    }
  }, []);

  // Mutation para criar cliente Asaas
  const createAsaasCustomerMutation = useMutation({
    mutationFn: async (studentId: string): Promise<AsaasCustomerResult> => {
      // Verificar se já está em progresso
      if (isOperationInProgress.current) {
        throw new Error('Operação já em andamento. Aguarde...');
      }

      isOperationInProgress.current = true;

      try {
        console.log('🚀 Criando cliente Asaas para estudante:', studentId);

        const { data, error } = await withTimeout(
          supabase.functions.invoke('create-asaas-customer', {
            body: { student_id: studentId },
          }),
          30000,
          'Create Asaas customer'
        );

        if (error) {
          console.error('❌ Erro na edge function:', error);
          throw new Error(error.message || 'Erro ao criar cliente no Asaas');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Falha na criação do cliente Asaas');
        }

        console.log('✅ Cliente Asaas criado:', data.asaas_customer_id);

        // Invalidar cache para forçar refetch
        validationCache.delete(studentId);
        queryClient.invalidateQueries({ queryKey: ['students', studentId] });
        queryClient.invalidateQueries({ queryKey: ['students'] });

        return data as AsaasCustomerResult;
      } finally {
        isOperationInProgress.current = false;
      }
    },
    onSuccess: (data) => {
      toast.success('Cliente criado com sucesso no sistema de pagamento');
      clearError();
    },
    onError: (error: unknown) => {
      console.error('❌ Erro na criação do cliente Asaas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao criar cliente';
      setError(errorMessage);
      
      // Tratar erros específicos
      if (errorMessage.includes('CPF')) {
        toast.error('CPF inválido. Verifique o documento do estudante.');
      } else if (errorMessage.includes('email')) {
        toast.error('Email inválido. Verifique o email do estudante.');
      } else if (errorMessage.includes('timeout')) {
        toast.error('Tempo limite excedido. Tente novamente.');
      } else {
        toast.error('Erro ao criar cliente no sistema de pagamento');
      }
    },
  });

  // Função principal para garantir cliente Asaas
  const ensureAsaasCustomer = useCallback(
    async (studentId: string): Promise<string> => {
      clearError();

      try {
        // 1. Validar dados do estudante
        console.log('🔍 Validando dados do estudante:', studentId);
        const validation = await validateStudentData(studentId);

        if (!validation.valid) {
          const missingFields = validation.missing.join(', ');
          const errorMsg = `Dados obrigatórios ausentes: ${missingFields}`;
          setError(errorMsg);
          throw new Error(errorMsg);
        }

        // 2. Verificar se já tem asaas_customer_id
        if (validation.student?.asaas_customer_id) {
          console.log('✅ Cliente Asaas já existe:', validation.student.asaas_customer_id);
          return validation.student.asaas_customer_id;
        }

        // 3. Criar cliente no Asaas
        console.log('🚀 Criando novo cliente Asaas...');
        const result = await createAsaasCustomerMutation.mutateAsync(studentId);

        if (!result.success || !result.asaas_customer_id) {
          throw new Error(result.error || 'Falha na criação do cliente');
        }

        return result.asaas_customer_id;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('❌ Erro em ensureAsaasCustomer:', error);
        setError(errorMessage);
        throw error;
      }
    },
    [validateStudentData, createAsaasCustomerMutation, clearError]
  );

  return {
    ensureAsaasCustomer,
    validateStudentData,
    loading: createAsaasCustomerMutation.isPending,
    error,
    clearError,
  };
}

