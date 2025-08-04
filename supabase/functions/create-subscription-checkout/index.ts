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
    
    const data: CreateCheckoutRequest = await req.json()
    console.log('Request data:', JSON.stringify(data, null, 2))
    
    // Configurações
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasWalletId = Deno.env.get('ASAAS_WALLET_ID')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    
    console.log('Environment check:', {
      hasApiKey: !!asaasApiKey,
      hasWalletId: !!asaasWalletId,
      environment: asaasEnvironment,
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

    // Testar conexão com API antes de prosseguir
    console.log('Testing Asaas API connection...')
    try {
      const testResponse = await fetch(`${asaasBaseUrl}/customers?limit=1`, {
        headers: {
          'access_token': asaasApiKey,
        }
      })
      
      console.log('API test response:', {
        status: testResponse.status,
        statusText: testResponse.statusText,
        ok: testResponse.ok
      })
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text()
        console.error('API key validation failed:', errorText)
        throw new Error(`Invalid Asaas API key or connection problem: ${testResponse.status} ${errorText}`)
      }
      
      console.log('API connection test successful')
    } catch (testError) {
      console.error('API connection test error:', testError)
      throw new Error(`Failed to connect to Asaas API: ${testError.message}`)
    }

    // 1. Buscar ou criar cliente no ASAAS
    let asaasCustomer
    
    // Primeiro tenta buscar por CPF
    const searchResponse = await fetch(
      `${asaasBaseUrl}/customers?cpfCnpj=${data.customer.cpfCnpj.replace(/\D/g, '')}`,
      {
        headers: {
          'access_token': asaasApiKey,
        }
      }
    )

    if (searchResponse.ok) {
      const searchResult = await searchResponse.json()
      if (searchResult.data && searchResult.data.length > 0) {
        asaasCustomer = searchResult.data[0]
        console.log('Customer found:', asaasCustomer.id)
      }
    }

    // Se não encontrou, cria novo cliente
    if (!asaasCustomer) {
      const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: data.customer.name,
          email: data.customer.email,
          cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ''),
          phone: data.customer.phone.replace(/\D/g, ''),
          mobilePhone: data.customer.phone.replace(/\D/g, ''),
          notificationDisabled: false,
        })
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
    const checkoutPayload = {
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
        startDate: startDate.toISOString().split('T')[0],
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
      callbackConfiguration: {
        successUrl: `http://localhost:8080/checkout/success?enrollment_id=${data.enrollment_id}`,
        cancelUrl: `http://localhost:8080/checkout/cancel`,
        expiredUrl: `http://localhost:8080/checkout/expired`,
        autoRedirect: true
      },
      externalReference: data.enrollment_id,
      walletId: asaasWalletId
    }

    console.log('Creating checkout with payload:', JSON.stringify(checkoutPayload, null, 2))

    const checkoutResponse = await fetch(`${asaasBaseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(checkoutPayload)
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
      
      // Analisar erro específico do Asaas
      let specificError = 'Failed to create checkout'
      if (errorData?.errors) {
        specificError = Object.values(errorData.errors).flat().join(', ')
      } else if (errorData?.message) {
        specificError = errorData.message
      }
      
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
        asaas_customer_id: asaasCustomer.id,
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
          id: asaasCustomer.id,
          name: asaasCustomer.name,
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