import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      student_id, 
      payment_id, 
      amount, 
      description, 
      due_date, 
      customer 
    } = await req.json()

    // Get Asaas API key from secrets
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create or get customer in Asaas
    const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj.replace(/\D/g, ''), // Remove non-digits
        phone: customer.phone.replace(/\D/g, ''), // Remove non-digits
        mobilePhone: customer.phone.replace(/\D/g, ''),
        address: 'Não informado',
        addressNumber: 'S/N',
        complement: '',
        province: 'Centro',
        city: 'Não informado',
        state: 'SP',
        postalCode: '00000000'
      })
    })

    let asaasCustomer
    if (customerResponse.ok) {
      asaasCustomer = await customerResponse.json()
    } else {
      // If customer already exists, try to find by CPF
      const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?cpfCnpj=${customer.cpfCnpj.replace(/\D/g, '')}`, {
        headers: {
          'access_token': asaasApiKey,
        }
      })
      
      if (searchResponse.ok) {
        const searchResult = await searchResponse.json()
        if (searchResult.data && searchResult.data.length > 0) {
          asaasCustomer = searchResult.data[0]
        }
      }
      
      if (!asaasCustomer) {
        throw new Error('Failed to create or find customer in Asaas')
      }
    }

    // Create payment in Asaas
    const paymentResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify({
        customer: asaasCustomer.id,
        billingType: 'UNDEFINED', // Let customer choose payment method
        value: amount,
        dueDate: due_date,
        description: description,
        externalReference: payment_id,
        postalService: false
      })
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error('Asaas payment creation failed:', errorData)
      throw new Error('Failed to create payment in Asaas')
    }

    const asaasPayment = await paymentResponse.json()

    // Update payment record in database
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        asaas_payment_id: asaasPayment.id,
        asaas_invoice_url: asaasPayment.invoiceUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id)

    if (updateError) {
      console.error('Database update failed:', updateError)
      throw new Error('Failed to update payment record')
    }

    return new Response(
      JSON.stringify({
        success: true,
        asaasPaymentId: asaasPayment.id,
        invoiceUrl: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-asaas-payment:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})