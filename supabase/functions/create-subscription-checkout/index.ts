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

    // Verificar se o estudante existe e buscar dados completos
    console.log('🔍 Verificando se estudante existe...')
    let studentData
    try {
      const result = await supabase
        .from('students')
        .select(`
          id,
          asaas_customer_id,
          profiles!students_id_fkey(
            nome_completo,
            email,
            cpf,
            whatsapp
          )
        `)
        .eq('id', student_id)
        .single()

      console.log('📊 Query resultado:', { data: result.data, error: result.error })

      if (result.error || !result.data) {
        console.error('❌ Erro na query student:', result.error)
        throw new Error(`Estudante não encontrado: ${result.error?.message || 'Dados ausentes'}`)
      }

      studentData = result.data
      console.log('✅ Estudante encontrado:', studentData.profiles?.nome_completo)
    } catch (studentQueryError) {
      console.error('❌ FALHA na consulta de estudante:', studentQueryError)
      throw new Error(`Erro ao consultar estudante: ${studentQueryError.message}`)
    }

    // Verificar se a turma existe
    console.log('🔍 Verificando se turma existe...')
    let classData
    try {
      const result = await supabase
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

      console.log('📊 Query classe resultado:', { data: result.data, error: result.error })

      if (result.error || !result.data) {
        console.error('❌ Erro na query class:', result.error)
        throw new Error(`Turma não encontrada: ${result.error?.message || 'Dados ausentes'}`)
      }

      classData = result.data
      
      if (!classData.ativa) {
        throw new Error('Turma não está ativa')
      }

      console.log('✅ Turma encontrada:', classData.nome || classData.modalidade)
    } catch (classQueryError) {
      console.error('❌ FALHA na consulta de turma:', classQueryError)
      throw new Error(`Erro ao consultar turma: ${classQueryError.message}`)
    }

    // Verificar se estudante já tem enrollment (qualquer status)
    console.log('🔍 Verificando enrollment existente (qualquer status)...')
    let existingEnrollment
    try {
      const result = await supabase
        .from('enrollments')
        .select('id, ativa, data_matricula, status, checkout_token, checkout_url')
        .eq('student_id', student_id)
        .eq('class_id', class_id)
        .order('created_at', { ascending: false })
        .maybeSingle()

      console.log('📊 Query enrollment resultado:', { data: result.data, error: result.error })

      if (result.error) {
        console.error('❌ Erro na query enrollment:', result.error)
        throw new Error(`Erro ao verificar matrícula: ${result.error.message}`)
      }

      existingEnrollment = result.data
      console.log('📋 Enrollment encontrado:', existingEnrollment ? 'SIM' : 'NÃO')
    } catch (enrollmentQueryError) {
      console.error('❌ FALHA na consulta de enrollment:', enrollmentQueryError)
      throw new Error(`Erro ao consultar enrollment: ${enrollmentQueryError.message}`)
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

    console.log('🔄 Iniciando lógica de enrollment...', {
      isAlreadyEnrolled,
      hasPendingEnrollment,
      create_enrollment,
      enrollmentStatus
    })

    // Lógica baseada no status existente e parâmetro create_enrollment
    if (isAlreadyEnrolled) {
      // Estudante já está matriculado (ativo)
      console.log('🚫 Estudante já está matriculado - retornando dados existentes')
      responseMessage = 'Estudante já está matriculado nesta turma'
      enrollmentId = existingEnrollment.id
      checkoutToken = existingEnrollment.checkout_token
      checkoutUrl = existingEnrollment.checkout_url
    } else if (hasPendingEnrollment && existingEnrollment) {
      // Já existe enrollment pendente - retornar dados existentes
      console.log('📋 Enrollment pendente existente encontrado - retornando dados')
      responseMessage = 'Enrollment pendente existente - checkout disponível'
      enrollmentId = existingEnrollment.id
      checkoutToken = existingEnrollment.checkout_token
      checkoutUrl = existingEnrollment.checkout_url || null
    } else if (create_enrollment) {
      console.log('🚀 ENTRANDO NA SEÇÃO CRÍTICA: create_enrollment = true')
      try {
      // Criar novo enrollment pendente com integração Asaas
      console.log('📝 Criando novo enrollment pendente...')
      
      const newToken = crypto.randomUUID()
      console.log('🎫 Token gerado:', newToken)
      
      // Configurações do Asaas
      const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
      const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
      const asaasUrl = asaasEnvironment === 'sandbox' 
        ? 'https://api-sandbox.asaas.com/v3'
        : 'https://api.asaas.com/v3'

      console.log('🔧 Configurações Asaas:', { 
        environment: asaasEnvironment, 
        url: asaasUrl,
        hasApiKey: !!asaasApiKey,
        apiKeyLength: asaasApiKey?.length || 0
      })

      if (!asaasApiKey) {
        console.error('❌ ASAAS_API_KEY não está configurada!')
        throw new Error('ASAAS_API_KEY não configurada')
      }

      console.log('🔄 Conectando com Asaas...', { environment: asaasEnvironment })

      // Verificar se já tem customer no Asaas
      let customerAsaasId = studentData.asaas_customer_id
      console.log('👤 Customer atual:', { 
        studentId: student_id, 
        existingCustomerId: customerAsaasId 
      })
      
      if (!customerAsaasId) {
        console.log('🔍 Customer Asaas não encontrado, criando...')
        
        const customerUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/create-asaas-customer`
        console.log('🚀 Chamando:', customerUrl)
        
        try {
          // Chamar função existente create-asaas-customer
          const customerResponse = await fetch(customerUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ student_id })
          })

          console.log('📥 Response status:', customerResponse.status)
          console.log('📥 Response ok:', customerResponse.ok)

          if (!customerResponse.ok) {
            const errorText = await customerResponse.text()
            console.error('❌ Erro ao criar customer Asaas - Response:', errorText)
            throw new Error(`Falha ao criar customer no Asaas: ${customerResponse.status} - ${errorText}`)
          }

          const customerResult = await customerResponse.json()
          console.log('📦 Customer result:', customerResult)
          customerAsaasId = customerResult.asaas_customer_id
          console.log('✅ Customer Asaas criado:', customerAsaasId)
        } catch (fetchError) {
          console.error('❌ Erro na chamada create-asaas-customer:', fetchError)
          throw new Error(`Erro ao chamar create-asaas-customer: ${fetchError.message}`)
        }
      } else {
        console.log('✅ Customer Asaas já existe:', customerAsaasId)
      }

      // Calcular próxima data de vencimento (7 dias)
      const nextDueDate = new Date()
      nextDueDate.setDate(nextDueDate.getDate() + 7)
      const dueDateFormatted = nextDueDate.toISOString().split('T')[0]

      // Preparar dados do checkout (API /checkouts para cartão de crédito)
      const checkoutData = {
        billingTypes: ["CREDIT_CARD"],           // ✅ Apenas cartão de crédito
        chargeTypes: ["RECURRENT"],             // ✅ Assinatura recorrente
        customer: customerAsaasId,              // ✅ Customer pré-existente
        name: `Matrícula - ${classData.nome || classData.modalidade}`,
        description: `Mensalidade ${classData.modalidade} - ${classData.nivel}`,
        value: Number(classData.valor_aula),
        callback: {
          successUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/checkout-success?enrollment=${newToken}`,
          autoRedirect: true
        }
      }

      console.log('📤 Enviando para Asaas:', JSON.stringify(checkoutData, null, 2))

      console.log('🌐 URL da API Asaas:', `${asaasUrl}/checkouts`)
      console.log('🔑 Headers da requisição:', {
        'Content-Type': 'application/json',
        'access_token': `${asaasApiKey?.substring(0, 10)}...` // Log apenas início da chave
      })

      try {
        // Criar checkout no Asaas (API correta para interface de pagamento)
        const checkoutResponse = await fetch(`${asaasUrl}/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey
          },
          body: JSON.stringify(checkoutData)
        })

        console.log('📊 Status da resposta Asaas:', checkoutResponse.status)
        console.log('📊 Headers da resposta:', Object.fromEntries(checkoutResponse.headers.entries()))

        const checkoutResult = await checkoutResponse.json()
        console.log('📥 Resposta completa do Asaas:', JSON.stringify(checkoutResult, null, 2))

        if (!checkoutResponse.ok) {
          console.error('❌ Erro na API Asaas - Status:', checkoutResponse.status)
          console.error('❌ Erro na API Asaas - Body:', checkoutResult)
          throw new Error(`Asaas Error: ${checkoutResult.description || checkoutResult.errors?.[0]?.description || 'Erro desconhecido'}`)
        }

        console.log('✅ Checkout criado no Asaas:', checkoutResult.url)
        
        // Verificar se a resposta tem os campos esperados
        if (!checkoutResult.id || !checkoutResult.url) {
          console.error('❌ Resposta do Asaas inválida - faltam campos obrigatórios')
          console.error('❌ ID presente:', !!checkoutResult.id)
          console.error('❌ URL presente:', !!checkoutResult.url)
          throw new Error('Resposta do Asaas não contém ID ou URL')
        }

      } catch (fetchError) {
        console.error('❌ Erro na requisição para Asaas:', fetchError)
        throw new Error(`Erro na comunicação com Asaas: ${fetchError.message}`)
      }

      // Criar enrollment no banco com dados reais do Asaas
      console.log('💾 Criando enrollment no banco...')
      
      const enrollmentData = {
        student_id,
        class_id,
        data_matricula: new Date().toISOString().split('T')[0],
        ativa: false, // Não ativo até confirmar pagamento
        status: 'pending',
        valor_pago_matricula: 0,
        checkout_token: newToken,
        checkout_url: checkoutResult.url, // URL real do Asaas
        asaas_checkout_id: checkoutResult.id, // ID do Asaas
        asaas_checkout_url: checkoutResult.url, // URL do Asaas
        checkout_created_at: new Date().toISOString()
      }
      
      console.log('💾 Dados do enrollment:', JSON.stringify(enrollmentData, null, 2))
      
      const { data: newEnrollment, error: createError } = await supabase
        .from('enrollments')
        .insert(enrollmentData)
        .select('id, checkout_token, checkout_url, asaas_checkout_id')
        .single()

      if (createError) {
        console.error('❌ Erro ao criar enrollment no banco:', createError)
        console.error('❌ Detalhes do erro:', JSON.stringify(createError, null, 2))
        throw new Error(`Falha ao criar enrollment pendente: ${createError.message || createError.details || 'Erro desconhecido'}`)
      }
      
      console.log('✅ Enrollment criado no banco:', newEnrollment)

      enrollmentId = newEnrollment.id
      checkoutToken = newEnrollment.checkout_token
      checkoutUrl = newEnrollment.checkout_url
      responseMessage = 'Enrollment pendente criado - checkout Asaas disponível'
      
      console.log('✅ Enrollment pendente criado com Asaas:', {
        id: enrollmentId,
        token: checkoutToken,
        url: checkoutUrl,
        asaas_id: newEnrollment.asaas_checkout_id
      })
      } catch (createEnrollmentError) {
        console.error('❌ ERRO NA SEÇÃO CRÍTICA create_enrollment:', createEnrollmentError)
        console.error('❌ Stack trace:', createEnrollmentError.stack)
        throw new Error(`Falha na criação do enrollment: ${createEnrollmentError.message}`)
      }
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