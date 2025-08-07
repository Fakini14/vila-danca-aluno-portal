import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCheckoutRequest {
  student_id: string;
  enrollment_id: string;
  class_id: string;
  billing_type: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone: string;
  };
  value: number;
  class_name: string;
  due_day?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Request received for create-subscription-checkout')
    
    // Add timeout to all async operations
    const timeout = (ms: number) => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    )
    
    const data: CreateCheckoutRequest = await Promise.race([
      req.json(),
      timeout(5000)
    ]) as CreateCheckoutRequest
    
    console.log('Request data received successfully')
    console.log('Student ID:', data.student_id)
    console.log('Class name:', data.class_name)
    
    // Modo de teste simples - apenas validar credenciais
    if (data.class_name === 'TEST_MODE') {
      console.log('🧪 Test mode activated - comprehensive validation')
      
      try {
        const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
        const asaasWalletId = Deno.env.get('ASAAS_WALLET_ID')
        const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
        
        console.log('🔍 Environment check:', {
          hasApiKey: !!asaasApiKey,
          hasWalletId: !!asaasWalletId,
          environment: asaasEnvironment,
          apiKeyLength: asaasApiKey?.length || 0,
          apiKeyPrefix: asaasApiKey?.substring(0, 10) || 'NOT_SET'
        })
        
        if (!asaasApiKey || !asaasWalletId) {
          throw new Error(`Missing credentials: API_KEY=${!!asaasApiKey}, WALLET_ID=${!!asaasWalletId}`)
        }
        
        const asaasBaseUrl = asaasEnvironment === 'sandbox' 
          ? 'https://sandbox.asaas.com/api/v3'
          : 'https://api.asaas.com/api/v3'
        
        console.log('🌐 Testing API connection to:', asaasBaseUrl)
        
        // Teste de conectividade com a API do Asaas
        const testResponse = await fetch(`${asaasBaseUrl}/customers?limit=1`, {
          headers: {
            'access_token': asaasApiKey,
            'Authorization': `Bearer ${asaasApiKey}`,
            'Content-Type': 'application/json',
          }
        })
        
        console.log('📡 API Response status:', testResponse.status, testResponse.statusText)
        
        let testResult = ''
        try {
          testResult = await testResponse.text()
        } catch (e) {
          testResult = `Error reading response: ${e.message}`
        }
        
        let parsedResult
        try {
          parsedResult = JSON.parse(testResult)
        } catch (e) {
          parsedResult = { rawText: testResult.substring(0, 300) }
        }
        
        console.log('✅ Test completed successfully')
        
        return new Response(JSON.stringify({
          test: 'comprehensive',
          timestamp: new Date().toISOString(),
          environment: {
            baseUrl: asaasBaseUrl,
            environment: asaasEnvironment
          },
          credentials: {
            hasApiKey: !!asaasApiKey,
            hasWalletId: !!asaasWalletId,
            apiKeyPrefix: asaasApiKey?.substring(0, 10) || 'NOT_SET'
          },
          apiTest: {
            status: testResponse.status,
            statusText: testResponse.statusText,
            ok: testResponse.ok,
            result: parsedResult
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
        
      } catch (error) {
        console.error('❌ Test mode failed:', error)
        
        return new Response(JSON.stringify({
          test: 'failed',
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        })
      }
    }
    
    // Configurações
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasWalletId = Deno.env.get('ASAAS_WALLET_ID')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'http://localhost:8080'
    
    console.log('Environment check:', {
      hasApiKey: !!asaasApiKey,
      hasWalletId: !!asaasWalletId,
      environment: asaasEnvironment,
      frontendUrl: frontendUrl,
      apiKeyLength: asaasApiKey?.length || 0,
      walletIdValue: asaasWalletId || 'NOT_SET'
    })
    
    if (!asaasApiKey || !asaasWalletId) {
      console.error('Missing Asaas credentials')
      throw new Error('Asaas credentials not configured. Please set ASAAS_API_KEY and ASAAS_WALLET_ID in Supabase secrets.')
    }
    
    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3'
    
    console.log('Creating checkout for enrollment:', data.enrollment_id)
    console.log('Using Asaas URL:', asaasBaseUrl)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Check if student already has asaas_customer_id (with timeout)
    console.log('Checking for existing Asaas customer for student:', data.student_id)
    const { data: studentData, error: studentError } = await Promise.race([
      supabase
        .from('students')
        .select('asaas_customer_id')
        .eq('id', data.student_id)
        .single(),
      timeout(10000)
    ]) as any

    if (studentError) {
      console.error('Error fetching student data:', studentError)
      throw new Error(`Failed to fetch student data: ${studentError.message}`)
    }
    
    console.log('Student data retrieved successfully')

    let asaasCustomerId = studentData?.asaas_customer_id

    if (asaasCustomerId) {
      console.log('Using existing Asaas customer:', asaasCustomerId)
    } else {
      console.log('No existing Asaas customer found, creating new one...')
      
      // Primeiro tenta buscar por CPF (para clientes criados antes da otimização)
      console.log('Searching for existing customer with CPF:', data.customer.cpfCnpj.replace(/\D/g, ''))
      const searchResponse = await Promise.race([
        fetch(
          `${asaasBaseUrl}/customers?cpfCnpj=${data.customer.cpfCnpj.replace(/\D/g, '')}`,
          {
            headers: {
              'access_token': asaasApiKey,
              'Authorization': `Bearer ${asaasApiKey}`,
              'Content-Type': 'application/json',
            }
          }
        ),
        timeout(15000)
      ]) as Response
      
      console.log('Customer search response:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        ok: searchResponse.ok
      })

      let asaasCustomer
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        if (searchResult.data && searchResult.data.length > 0) {
          asaasCustomer = searchResult.data[0]
          console.log('Customer found:', asaasCustomer.id)
        }
      }

      // Se não encontrou, cria novo cliente
      if (!asaasCustomer) {
      console.log('Creating new customer:', {
        name: data.customer.name,
        email: data.customer.email,
        cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ''),
        phone: data.customer.phone.replace(/\D/g, '')
      })
      
      const customerResponse = await Promise.race([
        fetch(`${asaasBaseUrl}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
            'Authorization': `Bearer ${asaasApiKey}`,
          },
          body: JSON.stringify({
            name: data.customer.name,
            email: data.customer.email,
            cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ''),
            phone: data.customer.phone.replace(/\D/g, ''),
            mobilePhone: data.customer.phone.replace(/\D/g, ''),
            notificationDisabled: false,
          })
        }),
        timeout(15000)
      ]) as Response
      
      console.log('Customer creation response:', {
        status: customerResponse.status,
        statusText: customerResponse.statusText,
        ok: customerResponse.ok
      })

      if (!customerResponse.ok) {
        let errorData
        let errorText
        
        try {
          errorText = await customerResponse.text()
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { message: errorText || 'Unknown error' }
        }
        
        console.error('Customer creation failed:', {
          status: customerResponse.status,
          statusText: customerResponse.statusText,
          body: errorData
        })
        
        let specificError = 'Failed to create customer'
        if (errorData?.errors) {
          specificError = Object.values(errorData.errors).flat().join(', ')
        } else if (errorData?.message) {
          specificError = errorData.message
        }
        
        throw new Error(`Asaas Customer Error (${customerResponse.status}): ${specificError}`)
      }

        asaasCustomer = await customerResponse.json()
        console.log('Customer created:', asaasCustomer.id)
      }

      asaasCustomerId = asaasCustomer.id

      // Save the asaas_customer_id to students table for future use
      const { error: updateError } = await supabase
        .from('students')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', data.student_id)

      if (updateError) {
        console.error('Warning: Failed to save asaas_customer_id to student record:', updateError)
        // Don't fail the checkout, just log the warning
      } else {
        console.log('Saved asaas_customer_id to student record for future use')
      }
    }

    // 2. Calcular datas da assinatura
    const today = new Date()
    const dueDay = data.due_day || 10
    let startDate = new Date(today.getFullYear(), today.getMonth(), dueDay)
    
    // Se a data já passou este mês, usar próximo mês
    if (startDate <= today) {
      startDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
    }

    // Data final da assinatura (1 ano no futuro)
    const endDate = new Date(startDate.getFullYear() + 1, startDate.getMonth(), dueDay)

    // 3. Criar checkout com assinatura recorrente
    const checkoutPayload: any = {
      billingTypes: [data.billing_type],
      chargeTypes: ["RECURRENT"],
      customerData: {
        name: data.customer.name,
        email: data.customer.email,
        cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ''),
        phone: data.customer.phone.replace(/\D/g, ''),
        mobilePhone: data.customer.phone.replace(/\D/g, ''),
      },
      items: [
        {
          name: `Mensalidade - ${data.class_name}`,
          description: `Assinatura mensal da turma ${data.class_name}`,
          value: data.value,
          quantity: 1
        }
      ],
      subscription: {
        cycle: "MONTHLY",
        nextDueDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        value: data.value,
        description: `Mensalidade - ${data.class_name}`,
        externalReference: data.enrollment_id,
        fine: {
          value: 2.00,
          type: "PERCENTAGE"
        },
        interest: {
          value: 1.00,
          type: "PERCENTAGE"
        },
        discount: {
          value: 5.00,
          dueDateLimitDays: 5,
          type: "PERCENTAGE"
        }
      },
      externalReference: data.enrollment_id,
      walletId: asaasWalletId
    }
    
    // Adicionar callbacks apenas se não for localhost/desenvolvimento
    const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1') || frontendUrl.includes('0.0.0.0')
    if (!isLocalhost) {
      console.log('Adding callback URLs for production environment')
      checkoutPayload.callback = {
        successUrl: `${frontendUrl}/checkout/success?enrollment_id=${data.enrollment_id}`,
        cancelUrl: `${frontendUrl}/checkout/cancel`,
        expiredUrl: `${frontendUrl}/checkout/expired`,
        autoRedirect: true
      }
    } else {
      console.log('Skipping callback URLs for localhost/development environment')
    }

    console.log('Creating checkout with payload:', JSON.stringify(checkoutPayload, null, 2))

    console.log('Making checkout request to:', `${asaasBaseUrl}/checkouts`)
    const checkoutResponse = await Promise.race([
      fetch(`${asaasBaseUrl}/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
          'Authorization': `Bearer ${asaasApiKey}`,
        },
        body: JSON.stringify(checkoutPayload)
      }),
      timeout(20000)
    ]) as Response
    
    console.log('Checkout creation response:', {
      status: checkoutResponse.status,
      statusText: checkoutResponse.statusText,
      ok: checkoutResponse.ok
    })

    if (!checkoutResponse.ok) {
      let errorData
      let errorText
      
      try {
        errorText = await checkoutResponse.text()
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { message: errorText || 'Unknown error' }
      }
      
      console.error('Checkout creation failed:', {
        status: checkoutResponse.status,
        statusText: checkoutResponse.statusText,
        headers: Object.fromEntries(checkoutResponse.headers.entries()),
        body: errorData,
        rawText: errorText
      })
      
      // Analisar erro específico do Asaas com logging melhorado
      let specificError = 'Failed to create checkout'
      let detailedError = errorData
      
      console.log('🔍 Debugging error data structure:', {
        errorDataType: typeof errorData,
        errorDataKeys: errorData ? Object.keys(errorData) : 'null',
        errorDataStringified: JSON.stringify(errorData, null, 2)
      })
      
      if (errorData?.errors) {
        if (typeof errorData.errors === 'object') {
          // Handle both array and object error formats
          if (Array.isArray(errorData.errors)) {
            specificError = errorData.errors.map(e => e.description || e.message || JSON.stringify(e)).join(', ')
          } else {
            specificError = Object.values(errorData.errors).flat().join(', ')
          }
        } else {
          specificError = String(errorData.errors)
        }
        detailedError = errorData.errors
      } else if (errorData?.message) {
        specificError = errorData.message
      } else if (errorData?.error) {
        specificError = errorData.error
      } else if (typeof errorData === 'string') {
        specificError = errorData
      } else if (errorData) {
        specificError = JSON.stringify(errorData)
      }
      
      console.error('🚨 Final error details:', {
        specificError,
        detailedError: JSON.stringify(detailedError, null, 2),
        rawErrorText: errorText?.substring(0, 500)
      })
      
      throw new Error(`Asaas Checkout Error (${checkoutResponse.status}): ${specificError}`)
    }

    const checkout = await checkoutResponse.json()
    console.log('Checkout created:', checkout.id)

    // 4. Salvar referência do checkout no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Criar um registro temporário para rastrear o checkout
    const { error: dbError } = await supabase
      .from('enrollment_checkouts')
      .insert({
        enrollment_id: data.enrollment_id,
        student_id: data.student_id,
        asaas_checkout_id: checkout.id,
        asaas_customer_id: asaasCustomerId,
        status: 'pending',
        checkout_url: checkout.url,
        value: data.value,
        created_at: new Date().toISOString()
      })

    // Se a tabela não existir, apenas loggar o aviso
    if (dbError) {
      console.warn('Could not save checkout reference (table may not exist):', dbError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        checkout: {
          id: checkout.id,
          url: checkout.url,
          status: checkout.status
        },
        customer: {
          id: asaasCustomerId,
          name: data.customer.name,
        },
        subscription: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          value: data.value
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-subscription-checkout:', error)
    console.error('Error stack:', error.stack)
    
    // Determinar mensagem específica baseada no erro
    let userMessage = 'Erro ao criar checkout de assinatura'
    let statusCode = 500
    
    if (error.message.includes('Asaas credentials not configured')) {
      userMessage = 'Configuração pendente: Os secrets do Asaas (ASAAS_API_KEY e ASAAS_WALLET_ID) precisam ser configurados no painel do Supabase.'
      statusCode = 503 // Service Unavailable
    } else if (error.message.includes('Invalid Asaas API key')) {
      userMessage = 'API key do Asaas inválida. Verifique se foi configurada corretamente no painel do Supabase.'
      statusCode = 401
    } else if (error.message.includes('Failed to connect to Asaas API')) {
      userMessage = 'Não foi possível conectar com o Asaas. Verifique as configurações.'
      statusCode = 502
    } else if (error.message.includes('Asaas Customer Error')) {
      userMessage = 'Erro ao criar cliente no Asaas. Verifique os dados informados (CPF, email, telefone).'
      statusCode = 400
    } else if (error.message.includes('Asaas Checkout Error')) {
      userMessage = 'Erro ao criar checkout no Asaas. ' + (error.message.split(': ')[1] || 'Tente novamente.')
      statusCode = 502
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        userMessage: userMessage,
        details: error.stack || 'No stack trace available',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    )
  }
})