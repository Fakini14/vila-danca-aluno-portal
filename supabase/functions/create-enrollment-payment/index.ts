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

    // Get Asaas environment and base URL
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Getting/creating Asaas customer for student:', student_id)

    // First, check if student already has asaas_customer_id
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('asaas_customer_id')
      .eq('id', student_id)
      .single()

    if (studentError) {
      console.error('Error fetching student data:', studentError)
      throw new Error('Failed to fetch student data')
    }

    let asaasCustomerId = studentData?.asaas_customer_id

    if (asaasCustomerId) {
      console.log('Using existing Asaas customer:', asaasCustomerId)
    } else {
      console.log('No existing Asaas customer found, creating new one...')
      
      // Create customer in Asaas using the same logic as before (fallback)
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

      const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
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
        const searchResponse = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${customer.cpfCnpj.replace(/\D/g, '')}`, {
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

      asaasCustomerId = asaasCustomer.id

      // Save the asaas_customer_id to students table for future use
      const { error: updateError } = await supabase
        .from('students')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', student_id)

      if (updateError) {
        console.error('Warning: Failed to save asaas_customer_id to student record:', updateError)
        // Don't fail the payment, just log the warning
      } else {
        console.log('Saved asaas_customer_id to student record for future use')
      }
    }

    console.log('Using Asaas customer ID:', asaasCustomerId)

    // Create payment in Asaas with enrollment metadata
    const paymentPayload = {
      customer: asaasCustomerId,
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

    const paymentResponse = await fetch(`${asaasBaseUrl}/payments`, {
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