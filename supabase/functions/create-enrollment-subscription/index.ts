// supabase/functions/create-enrollment-subscription/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateSubscriptionRequest {
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
  due_day?: number; // Dia do vencimento (5, 10, 15, 20, 25)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: CreateSubscriptionRequest = await req.json()
    
    // Configurações
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3'
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('Creating subscription for enrollment:', data.enrollment_id)

    // 1. Buscar ou criar cliente no ASAAS
    let asaasCustomer
    
    // Primeiro tenta buscar por CPF
    const searchResponse = await fetch(
      `${asaasBaseUrl}/customers?cpfCnpj=${data.customer.cpfCnpj.replace(/\D/g, '')}`,
      {
        headers: {
          'access_token': asaasApiKey!,
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
          'access_token': asaasApiKey!,
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
        const error = await customerResponse.json()
        console.error('Customer creation failed:', error)
        throw new Error('Failed to create customer')
      }

      asaasCustomer = await customerResponse.json()
      console.log('Customer created:', asaasCustomer.id)
    }

    // 2. Calcular próxima data de vencimento
    const today = new Date()
    const dueDay = data.due_day || 10
    let nextDueDate = new Date(today.getFullYear(), today.getMonth(), dueDay)
    
    // Se a data já passou este mês, usar próximo mês
    if (nextDueDate <= today) {
      nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay)
    }

    // 3. Criar assinatura no ASAAS
    const subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey!,
      },
      body: JSON.stringify({
        customer: asaasCustomer.id,
        billingType: data.billing_type,
        nextDueDate: nextDueDate.toISOString().split('T')[0],
        value: data.value,
        cycle: 'MONTHLY',
        description: `Mensalidade - ${data.class_name}`,
        externalReference: data.enrollment_id,
        fine: {
          value: 2.00,
          type: 'PERCENTAGE'
        },
        interest: {
          value: 1.00,
          type: 'PERCENTAGE'
        },
        discount: {
          value: 5.00,
          dueDateLimitDays: 5,
          type: 'PERCENTAGE'
        }
      })
    })

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.json()
      console.error('Subscription creation failed:', error)
      throw new Error(`Failed to create subscription: ${JSON.stringify(error)}`)
    }

    const asaasSubscription = await subscriptionResponse.json()
    console.log('Subscription created:', asaasSubscription.id)

    // 4. Salvar assinatura no banco de dados
    const { error: dbError } = await supabase
      .from('subscriptions')
      .insert({
        student_id: data.student_id,
        enrollment_id: data.enrollment_id,
        asaas_subscription_id: asaasSubscription.id,
        asaas_customer_id: asaasCustomer.id,
        billing_type: data.billing_type,
        value: data.value,
        next_due_date: nextDueDate.toISOString().split('T')[0],
        status: 'active'
      })

    if (dbError) {
      console.error('Database insert failed:', dbError)
      throw new Error('Failed to save subscription')
    }

    // 5. Buscar primeira cobrança gerada
    let firstPayment = null
    try {
      // Aguardar um pouco para o ASAAS processar
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const paymentsResponse = await fetch(
        `${asaasBaseUrl}/subscriptions/${asaasSubscription.id}/payments`,
        {
          headers: {
            'access_token': asaasApiKey!,
          }
        }
      )

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        if (paymentsData.data && paymentsData.data.length > 0) {
          firstPayment = paymentsData.data[0]
          
          // Salvar primeira cobrança no banco
          await supabase
            .from('subscription_payments')
            .insert({
              subscription_id: data.enrollment_id, // Usar enrollment_id temporariamente
              asaas_payment_id: firstPayment.id,
              amount: firstPayment.value,
              due_date: firstPayment.dueDate,
              status: firstPayment.status,
              payment_method: firstPayment.billingType,
              invoice_url: firstPayment.invoiceUrl,
              bank_slip_url: firstPayment.bankSlipUrl,
              pix_qr_code: firstPayment.pixQrCode,
            })
        }
      }
    } catch (e) {
      console.error('Failed to fetch first payment:', e)
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: asaasSubscription.id,
          status: asaasSubscription.status,
          nextDueDate: asaasSubscription.nextDueDate,
        },
        firstPayment: firstPayment ? {
          id: firstPayment.id,
          invoiceUrl: firstPayment.invoiceUrl,
          bankSlipUrl: firstPayment.bankSlipUrl,
          pixQrCode: firstPayment.pixQrCode,
          dueDate: firstPayment.dueDate,
          value: firstPayment.value,
        } : null,
        customer: {
          id: asaasCustomer.id,
          name: asaasCustomer.name,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})