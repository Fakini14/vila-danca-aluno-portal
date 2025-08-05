import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateAsaasCustomerRequest {
  student_id: string;
}

interface AsaasCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CREATE ASAAS CUSTOMER FUNCTION STARTED ===')
    
    const { student_id }: CreateAsaasCustomerRequest = await req.json()
    console.log('Request data:', { student_id })

    if (!student_id) {
      throw new Error('student_id is required')
    }

    // Get environment variables
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY')
    const asaasEnvironment = Deno.env.get('ASAAS_ENVIRONMENT') || 'sandbox'
    
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured')
    }

    const asaasBaseUrl = asaasEnvironment === 'sandbox' 
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://www.asaas.com/api/v3'

    console.log('Using Asaas environment:', asaasEnvironment)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if customer already exists
    const { data: existingStudent, error: checkError } = await supabase
      .from('students')
      .select('asaas_customer_id')
      .eq('id', student_id)
      .single()

    if (checkError) {
      console.error('Error checking existing customer:', checkError)
      throw new Error('Failed to check existing customer')
    }

    if (existingStudent?.asaas_customer_id) {
      console.log('Customer already exists:', existingStudent.asaas_customer_id)
      return new Response(
        JSON.stringify({
          success: true,
          asaas_customer_id: existingStudent.asaas_customer_id,
          message: 'Customer already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch student data with profile
    console.log('Fetching student data...')
    const { data: studentData, error: fetchError } = await supabase
      .from('students')
      .select(`
        *,
        profiles!students_id_fkey(
          nome_completo,
          email,
          cpf,
          whatsapp
        )
      `)
      .eq('id', student_id)
      .single()

    if (fetchError || !studentData) {
      console.error('Error fetching student data:', fetchError)
      throw new Error('Student not found')
    }

    console.log('Student data fetched:', {
      id: studentData.id,
      nome: studentData.profiles?.nome_completo,
      email: studentData.profiles?.email,
      cpf: studentData.profiles?.cpf?.substring(0, 3) + '***', // Log partial CPF for privacy
      whatsapp: studentData.profiles?.whatsapp,
      cep: studentData.cep
    })

    // Prepare customer data for Asaas
    const customerPayload: AsaasCustomerPayload = {
      name: studentData.profiles?.nome_completo || 'Nome não informado',
      email: studentData.profiles?.email || studentData.email || '',
      cpfCnpj: studentData.profiles?.cpf?.replace(/\D/g, '') || '', // Remove non-digits
    }

    // Add optional fields if available
    if (studentData.profiles?.whatsapp || studentData.whatsapp) {
      const phone = (studentData.profiles?.whatsapp || studentData.whatsapp).replace(/\D/g, '')
      customerPayload.phone = phone
      customerPayload.mobilePhone = phone
    }

    // Add address information if available
    if (studentData.endereco_completo) {
      customerPayload.address = studentData.endereco_completo
      customerPayload.addressNumber = 'S/N'
      customerPayload.complement = ''
      customerPayload.province = 'Centro'
      customerPayload.city = 'Não informado'
      customerPayload.state = 'SP'
    }

    if (studentData.cep) {
      customerPayload.postalCode = studentData.cep.replace(/\D/g, '')
    }

    // Set defaults for required fields
    if (!customerPayload.address) {
      customerPayload.address = 'Não informado'
      customerPayload.addressNumber = 'S/N'
      customerPayload.complement = ''
      customerPayload.province = 'Centro'
      customerPayload.city = 'Não informado'
      customerPayload.state = 'SP'
      customerPayload.postalCode = '00000000'
    }

    console.log('Creating customer in Asaas with payload:', {
      ...customerPayload,
      cpfCnpj: customerPayload.cpfCnpj?.substring(0, 3) + '***' // Log partial CPF
    })

    // Create customer in Asaas
    const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': asaasApiKey,
        'Authorization': `Bearer ${asaasApiKey}`, // Double auth headers for compatibility
      },
      body: JSON.stringify(customerPayload)
    })

    let asaasCustomer
    if (customerResponse.ok) {
      asaasCustomer = await customerResponse.json()
      console.log('Customer created successfully:', asaasCustomer.id)
    } else {
      const errorText = await customerResponse.text()
      console.error('Asaas customer creation failed:', {
        status: customerResponse.status,
        statusText: customerResponse.statusText,
        body: errorText
      })

      // Try to find existing customer by CPF if creation failed
      if (customerPayload.cpfCnpj) {
        console.log('Trying to find existing customer by CPF...')
        const searchResponse = await fetch(`${asaasBaseUrl}/customers?cpfCnpj=${customerPayload.cpfCnpj}`, {
          headers: {
            'access_token': asaasApiKey,
            'Authorization': `Bearer ${asaasApiKey}`,
          }
        })
        
        if (searchResponse.ok) {
          const searchResult = await searchResponse.json()
          if (searchResult.data && searchResult.data.length > 0) {
            asaasCustomer = searchResult.data[0]
            console.log('Found existing customer:', asaasCustomer.id)
          }
        }
      }
      
      if (!asaasCustomer) {
        throw new Error(`Failed to create customer in Asaas: ${errorText}`)
      }
    }

    // Update student record with asaas_customer_id
    console.log('Updating student record with asaas_customer_id...')
    const { error: updateError } = await supabase
      .from('students')
      .update({
        asaas_customer_id: asaasCustomer.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)

    if (updateError) {
      console.error('Failed to update student record:', updateError)
      throw new Error('Failed to update student record with asaas_customer_id')
    }

    console.log('=== ASAAS CUSTOMER CREATED SUCCESSFULLY ===')
    
    return new Response(
      JSON.stringify({
        success: true,
        asaas_customer_id: asaasCustomer.id,
        message: 'Customer created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== ERROR IN CREATE ASAAS CUSTOMER ===')
    console.error('Error:', error)
    console.error('Stack:', error.stack)
    
    return new Response(
      JSON.stringify({
        success: false,
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