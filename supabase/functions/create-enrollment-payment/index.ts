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
      payment_id, 
      student_id,
      enrollment_ids = [],
      amount, 
      description, 
      due_date, 
      customer,
      billing_type = 'UNDEFINED' // Let customer choose payment method
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

    console.log('Creating/updating customer in Asaas for:', customer.email)

    // Create or get customer in Asaas
    const customerPayload = {
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
    }

    const customerResponse = await fetch('https://www.asaas.com/api/v3/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(customerPayload)
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

    console.log('Customer resolved:', asaasCustomer.id)

    // Create payment in Asaas with enrollment metadata
    const paymentPayload = {
      customer: asaasCustomer.id,
      billingType: billing_type,
      value: amount,
      dueDate: due_date,
      description: description,
      externalReference: payment_id,
      postalService: false,
      split: [],
      callback: {
        successUrl: `${Deno.env.get('SITE_URL')}/checkout/success?payment=${payment_id}`,
        autoRedirect: true
      },
      creditCard: {
        holderName: customer.name,
        number: null,
        expiryMonth: null,
        expiryYear: null,
        ccv: null
      },
      fine: {
        value: 2.00,
        type: 'PERCENTAGE'
      },
      interest: {
        value: 1.00,
        type: 'PERCENTAGE'
      },
      discount: {
        value: 0,
        dueDateLimitDays: 0
      }
    }

    const paymentResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
      },
      body: JSON.stringify(paymentPayload)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error('Asaas payment creation failed:', errorData)
      throw new Error(`Failed to create payment in Asaas: ${JSON.stringify(errorData)}`)
    }

    const asaasPayment = await paymentResponse.json()
    console.log('Payment created in Asaas:', asaasPayment.id)

    // Update payment record in database with Asaas data
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

    // Store enrollment IDs in metadata for webhook processing
    if (enrollment_ids.length > 0) {
      try {
        const { error: metadataError } = await supabase
          .from('payment_metadata')
          .insert({
            payment_id: payment_id,
            asaas_payment_id: asaasPayment.id,
            enrollment_ids: enrollment_ids,
            metadata: {
              student_id,
              customer_id: asaasCustomer.id,
              created_at: new Date().toISOString()
            }
          })
        
        if (metadataError) {
          console.error('Failed to store metadata:', metadataError)
        }
      } catch (metadataError) {
        console.error('Metadata storage error:', metadataError)
        // Don't fail the payment creation for metadata issues
      }
    }

    console.log('Payment processed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        asaasPaymentId: asaasPayment.id,
        checkout_url: asaasPayment.invoiceUrl,
        invoice_url: asaasPayment.invoiceUrl,
        bankSlipUrl: asaasPayment.bankSlipUrl,
        pixQrCode: asaasPayment.pixQrCode,
        payment: {
          id: asaasPayment.id,
          status: asaasPayment.status,
          value: asaasPayment.value,
          dueDate: asaasPayment.dueDate,
          invoiceUrl: asaasPayment.invoiceUrl
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in create-enrollment-payment:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})