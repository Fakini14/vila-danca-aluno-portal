import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSubscriptionCheckoutRequest {
  student_id: string;
  class_id: string;
  create_enrollment?: boolean; // Default: true para Etapa 2, false para apenas validação
}

interface CheckoutResponse {
  success: boolean;
  checkout_url?: string | null;
  enrollment_id?: string | null; // ID do enrollment criado 
  checkout_token?: string | null; // Token para rastrear checkout
  enrollment_data?: {
    student_id: string;
    class_id: string;
    class_name: string;
    monthly_value: number;
    enrollment_fee: number;
    student_name: string;
    already_enrolled: boolean;
    enrollment_status?: string; // pending, active, cancelled
  };
  message: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE SUBSCRIPTION CHECKOUT FUNCTION STARTED ===')
    
    const { student_id, class_id, create_enrollment = true }: CreateSubscriptionCheckoutRequest = await req.json()
    console.log('Request data:', { student_id, class_id, create_enrollment })

    // Validações básicas de entrada
    if (!student_id || !class_id) {
      const missingFields = [];
      if (!student_id) missingFields.push('student_id');
      if (!class_id) missingFields.push('class_id');
      
      throw new Error(`Parâmetros obrigatórios ausentes: ${missingFields.join(', ')}`)
    }

    // Validar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(student_id)) {
      throw new Error('student_id deve ser um UUID válido')
    }
    if (!uuidRegex.test(class_id)) {
      throw new Error('class_id deve ser um UUID válido')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('✅ Validações de entrada concluídas')

    // Verificar se o estudante existe
    console.log('🔍 Verificando se estudante existe...')
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        profiles!students_id_fkey(
          nome_completo,
          email
        )
      `)
      .eq('id', student_id)
      .single()

    if (studentError || !studentData) {
      console.error('❌ Estudante não encontrado:', studentError)
      throw new Error('Estudante não encontrado')
    }

    console.log('✅ Estudante encontrado:', studentData.profiles?.nome_completo)

    // Verificar se a turma existe
    console.log('🔍 Verificando se turma existe...')
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        nome,
        modalidade,
        nivel,
        valor_aula,
        valor_matricula,
        ativa
      `)
      .eq('id', class_id)
      .single()

    if (classError || !classData) {
      console.error('❌ Turma não encontrada:', classError)
      throw new Error('Turma não encontrada')
    }

    if (!classData.ativa) {
      throw new Error('Turma não está ativa')
    }

    console.log('✅ Turma encontrada:', classData.nome || classData.modalidade)

    // Verificar se estudante já tem enrollment (qualquer status)
    console.log('🔍 Verificando enrollment existente (qualquer status)...')
    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, ativa, data_matricula, status, checkout_token, checkout_url')
      .eq('student_id', student_id)
      .eq('class_id', class_id)
      .order('created_at', { ascending: false })
      .maybeSingle()

    if (enrollmentError) {
      console.error('❌ Erro ao verificar matrícula:', enrollmentError)
      throw new Error('Erro ao verificar matrícula existente')
    }

    const isAlreadyEnrolled = existingEnrollment?.ativa === true
    const hasPendingEnrollment = existingEnrollment?.status === 'pending'
    const enrollmentStatus = existingEnrollment?.status || null

    console.log(`📋 Status encontrado: ${enrollmentStatus || 'NENHUM'} | Ativa: ${existingEnrollment?.ativa || false}`)

    console.log('✅ Verificações do banco de dados concluídas')

    let enrollmentId: string | null = null
    let checkoutToken: string | null = null
    let checkoutUrl: string | null = null
    let responseMessage = ''

    // Lógica baseada no status existente e parâmetro create_enrollment
    if (isAlreadyEnrolled) {
      // Estudante já está matriculado (ativo)
      responseMessage = 'Estudante já está matriculado nesta turma'
      enrollmentId = existingEnrollment.id
      checkoutToken = existingEnrollment.checkout_token
      checkoutUrl = existingEnrollment.checkout_url
    } else if (hasPendingEnrollment && existingEnrollment) {
      // Já existe enrollment pendente - retornar dados existentes
      console.log('📋 Enrollment pendente existente encontrado')
      responseMessage = 'Enrollment pendente existente - checkout disponível'
      enrollmentId = existingEnrollment.id
      checkoutToken = existingEnrollment.checkout_token
      checkoutUrl = existingEnrollment.checkout_url || null
    } else if (create_enrollment) {
      // Criar novo enrollment pendente
      console.log('📝 Criando novo enrollment pendente...')
      
      const newToken = crypto.randomUUID()
      const mockCheckoutUrl = `https://sandbox.asaas.com/checkout/${newToken}?student=${encodeURIComponent(studentData.profiles?.nome_completo || '')}&class=${encodeURIComponent(classData.nome || classData.modalidade)}&value=${classData.valor_aula}`
      
      const { data: newEnrollment, error: createError } = await supabase
        .from('enrollments')
        .insert({
          student_id,
          class_id,
          data_matricula: new Date().toISOString().split('T')[0],
          ativa: false, // Não ativo até confirmar pagamento
          status: 'pending',
          valor_pago_matricula: 0,
          checkout_token: newToken,
          checkout_url: mockCheckoutUrl,
          checkout_created_at: new Date().toISOString()
        })
        .select('id, checkout_token, checkout_url')
        .single()

      if (createError) {
        console.error('❌ Erro ao criar enrollment:', createError)
        throw new Error('Falha ao criar enrollment pendente')
      }

      enrollmentId = newEnrollment.id
      checkoutToken = newEnrollment.checkout_token
      checkoutUrl = newEnrollment.checkout_url
      responseMessage = 'Enrollment pendente criado - checkout disponível'
      
      console.log('✅ Enrollment pendente criado:', {
        id: enrollmentId,
        token: checkoutToken,
        url: checkoutUrl
      })
    } else {
      // Apenas validação - não criar enrollment
      responseMessage = 'Dados validados - disponível para matrícula'
    }

    // Preparar resposta com dados reais
    const enrollmentData = {
      student_id,
      class_id,
      class_name: classData.nome || `${classData.modalidade} - ${classData.nivel}`,
      monthly_value: Number(classData.valor_aula),
      enrollment_fee: Number(classData.valor_matricula || 0),
      student_name: studentData.profiles?.nome_completo || 'Nome não encontrado',
      already_enrolled: isAlreadyEnrolled,
      enrollment_status: enrollmentStatus
    }

    const response: CheckoutResponse = {
      success: true,
      checkout_url: checkoutUrl,
      enrollment_id: enrollmentId,
      checkout_token: checkoutToken,
      enrollment_data: enrollmentData,
      message: responseMessage
    }

    console.log('=== CHECKOUT MOCK CREATED SUCCESSFULLY ===')
    console.log('Response data:', response)
    
    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== ERROR IN CREATE SUBSCRIPTION CHECKOUT ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    
    const errorResponse: CheckoutResponse = {
      success: false,
      message: 'Erro na criação do checkout',
      error: error.message || 'Internal server error'
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})